from fastapi import APIRouter, HTTPException, Request, Depends
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import GrammarReview, WordBatchResponse, VocabularyBatchRequest, EssenceWritingReponse
from fastapi.concurrency import run_in_threadpool
from scipy import spatial

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/generate-sentence/{phrase_id}")
async def user_rewrite_phrases(phrase_id: int, supabase=Depends(get_user_client)):
    
    result_phrase = supabase.table("word_bank").select("word_phrase").eq("word_id", phrase_id).execute()

    if (not result_phrase) or len(result_phrase.data) == 0:
        return { "error" : "Invalid" }

    try:
        prompt = f"Generate a sentence that excludes the phrase ({result_phrase.data[0]["word_phrase"]}) but naturally encourages its use when the sentence is rewritten."
        
        num_calls = 0

        while num_calls < 3:

            generated_text = await openai_client.responses.create(
                model="gpt-4.1-mini-2025-04-14",
                input=prompt
            )

            generated_embeddings = await openai_client.embeddings.create(
                input=generated_text.output_text,
                model="text-embedding-3-small"
            )

            new_embed_id = await run_in_threadpool(lambda: supabase.rpc("unique_generated_sentence", { "p_word_id": phrase_id, "p_embedding": generated_embeddings.data[0].embedding }).execute())

            if new_embed_id.data > -1:
                return { 
                    "sentence": generated_text.output_text, 
                    "new_embed_id": new_embed_id.data 
                }

            num_calls += 1

        return {"error": "Failed to generate a unique sentence. Try again."}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.get("/grammar-check/{user_sentence}")
async def grammar_check(user_sentence: str, supabase=Depends(get_user_client)):
    
    if len(user_sentence.strip()) == 0:
        return { "grammar_check": [] }

    try:
        
        prompt = f"""
            Find grammar or spelling errors only.
            Ignore style or wording.
            If none, return [].

            Sentence:
            {user_sentence}
        """

        grammar_check = await openai_client.responses.parse(
                model="gpt-4.1-mini-2025-04-14",
                input=prompt,
                text_format=GrammarReview
            )
        
        if grammar_check.output_parsed:
            result = {}

            for mistake in grammar_check.output_parsed.mistakes:
                if mistake.mistake_type not in result:
                    result[mistake.mistake_type] = []
                
                result[mistake.mistake_type].append(mistake.mistake)
            
            grammar_check_list = [
                {
                    "mistake_type": mistake_type,
                    "mistakes": mistakes
                }
                for mistake_type, mistakes in result.items()
            ]

            return { "grammar_check": grammar_check_list }

        return { "grammar_check": [] }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/review-user-response/{user_sentence}/{generated_sentence_id}")
async def user_sentence_review(user_sentence: str, generated_sentence_id: int, supabase=Depends(get_user_client)):

    try:
        generated_embeddings = await openai_client.embeddings.create(
            input=user_sentence.strip(),
            model="text-embedding-3-small"
        )
        
        similarity_result = await run_in_threadpool(lambda: supabase.rpc("check_similarity_for_user_sentence", { "p_embed_id": generated_sentence_id, "p_embedding": generated_embeddings.data[0].embedding }).execute())
        
        return { "similarity": similarity_result.data }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/vocabulary-words/batch")
async def vocabulary_words(
    payload: VocabularyBatchRequest, 
    request: Request, 
    supabase=Depends(get_user_client)
):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    cleaned_words = set()
    for w in payload.words:
        cleaned = w.strip().lower()
        if 0 < len(cleaned) <= 25 and cleaned.isalpha():
            cleaned_words.add(cleaned)
    
    if not cleaned_words:
        return []

    try:
        existing_result = await run_in_threadpool(
            lambda: supabase.table("vocabulary_words")
            .select("*")
            .in_("word", list(cleaned_words))
            .execute()
        )
        
        existing_words_data = existing_result.data 
        found_word_strings = {row['word'] for row in existing_words_data}
        
        missing_words = list(cleaned_words - found_word_strings)
        newly_inserted_words = []

        if missing_words:
            prompt = f"""
            Analyze the following list of words: {', '.join(missing_words)}.
            For each VALID English word, provide the word, a concise definition, and its CEFR level (A1, A2, B1, B2, C1, C2).
            Ignore invalid words, names, or gibberish.
            """

            ai_response = await openai_client.beta.chat.completions.parse(
                model="gpt-4.1-mini-2025-04-14",
                messages=[{"role": "user", "content": prompt}],
                response_format=WordBatchResponse
            )
            
            generated_data = ai_response.choices[0].message.parsed.words

            if generated_data:
                cefr_map = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}
                words_to_insert = []
                
                for item in generated_data:
                    words_to_insert.append({
                        "word": item.word.lower(), 
                        "definition": item.definition,
                        "word_level": cefr_map.get(item.cefr_level.upper(), 3) 
                    })

                insert_result = await run_in_threadpool(
                    lambda: supabase.table("vocabulary_words")
                    .insert(words_to_insert)
                    .execute()
                )
                newly_inserted_words = insert_result.data

        all_words = existing_words_data + newly_inserted_words
        
        if not all_words:
            return []

        user_vocab_entries = [
            {"user_id": user["user_id"], "word_id": w["word_id"]} 
            for w in all_words
        ]

        await run_in_threadpool(
            lambda: supabase.table("user_vocabulary")
            .upsert(user_vocab_entries, on_conflict="user_id, word_id", ignore_duplicates=True)
            .execute()
        )

        return all_words

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/essence-writing-check")
async def essence_writing_check(user_response: EssenceWritingReponse, supabase=Depends(get_user_client)):
    generated_embeddings = await openai_client.embeddings.create(
        input=[user_response.words_100, user_response.words_50, user_response.words_25],
        model="text-embedding-3-small"
    )

    res_12 = 1 - spatial.distance.cosine(generated_embeddings.data[0].embedding, generated_embeddings.data[1].embedding)
    res_23 = 1 - spatial.distance.cosine(generated_embeddings.data[1].embedding, generated_embeddings.data[2].embedding)
    res_13 = 1 - spatial.distance.cosine(generated_embeddings.data[0].embedding, generated_embeddings.data[2].embedding)

    return [res_12, res_23, res_13]