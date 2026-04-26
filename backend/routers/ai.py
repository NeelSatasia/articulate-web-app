from fastapi import APIRouter, HTTPException, Request, Depends
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import *
from fastapi.concurrency import run_in_threadpool
from scipy import spatial
from typing import Dict, List
import ast
import re

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/generate-sentence/{phrase_id}")
async def user_rewrite_phrases(phrase_id: int, supabase=Depends(get_user_client)):
    
    result_phrase = await run_in_threadpool(lambda: supabase.table("word_bank").select("word_phrase").eq("word_id", phrase_id).execute())

    if (not result_phrase) or len(result_phrase.data) == 0:
        return { "error" : "Invalid" }

    try:
        prompt = f"Generate a sentence that excludes the phrase ({result_phrase.data[0]["word_phrase"]}) but naturally encourages its use when the sentence is rewritten."
        
        generated_text = await openai_client.responses.create(
            model="gpt-4.1-mini-2025-04-14",
            input=prompt
        )

        return { 
            "sentence": generated_text.output_text
        }
    
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


@router.get("/review-user-response/{user_sentence}/{generated_sentence}")
async def user_sentence_review(user_sentence: str, generated_sentence: str, supabase=Depends(get_user_client)):

    if user_sentence.strip() == "" or generated_sentence.strip() == "":
        return { "similarity" : 0.0 }

    try:
        generated_embeddings = await openai_client.embeddings.create(
            input=[user_sentence.strip(), generated_sentence.strip()],
            model="text-embedding-3-small"
        )
        
        similarity_result = 1 - spatial.distance.cosine(generated_embeddings.data[0].embedding, generated_embeddings.data[1].embedding)

        return { "similarity": similarity_result }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/generate-sentence-for-word/{vocabulary_word}")
async def generate_sentence_for_word(vocabulary_word: str, supabase=Depends(get_user_client)):

    if vocabulary_word.strip() == "" or vocabulary_word.isalpha() == False or len(vocabulary_word.strip().split(' ')) > 1:
        return
    
    prompt = f"Generate a sentence that carries the meaning of {vocabulary_word.strip()} without using the word itself"

    try:
    
        generated_text = await openai_client.responses.create(
            model="gpt-4.1-mini-2025-04-14",
            input=prompt
        )

        if generated_text:
            return { "sentence": generated_text.output_text }
        
        return { "sentence": "" }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/word-phrases")
async def new_word_phrases(
    request: Request,
    new_data: Dict[int, List[str]],
    supabase=Depends(get_user_client)
):
    user = request.session.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        rows = []

        for word_category_id, word_phrases in new_data.items():
            category_id = int(word_category_id)

            for word_phrase in word_phrases:
                cleaned_phrase = word_phrase.strip()

                if not cleaned_phrase:
                    continue

                rows.append({
                    "user_id": user["user_id"],
                    "word_category_id": category_id,
                    "word_phrase": cleaned_phrase,
                })

        if not rows:
            return []

        embedding_response = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=[row["word_phrase"] for row in rows],
        )

        for idx, row in enumerate(rows):
            row["embedding"] = embedding_response.data[idx].embedding

        resp_data = await run_in_threadpool(
            lambda: supabase.table("word_bank").insert(rows).execute()
        )

        if resp_data:
            return resp_data.data

        return []

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/word-phrases")
async def edit_word_phrases(
    request: Request,
    modified_data: Dict[int, Dict[int, str]],
    supabase=Depends(get_user_client)
):
    user = request.session.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        edits = []

        for word_category_id, word_phrases in modified_data.items():
            category_id = int(word_category_id)

            for word_id, word_phrase in word_phrases.items():
                cleaned_phrase = word_phrase.strip()

                if not cleaned_phrase:
                    continue

                edits.append({
                    "word_id": int(word_id),
                    "word_category_id": category_id,
                    "word_phrase": cleaned_phrase,
                })

        if not edits:
            return []

        embedding_response = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=[item["word_phrase"] for item in edits],
        )

        updates = []

        for idx, item in enumerate(edits):
            updates.append({
                "word_id": item["word_id"],
                "user_id": user["user_id"],
                "word_category_id": item["word_category_id"],
                "word_phrase": item["word_phrase"],
                "embedding": embedding_response.data[idx].embedding,
            })

        await run_in_threadpool(
            lambda: supabase.table("word_bank")
            .upsert(updates, on_conflict="word_id")
            .execute()
        )

        return {"updated_count": len(edits)}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/vocabulary")
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
        existing_result = await run_in_threadpool(lambda: supabase.table("vocabulary_words").select("*").in_("word", list(cleaned_words)).execute())
        
        existing_words_data = existing_result.data 
        found_word_strings = {row['word'] for row in existing_words_data}
        
        missing_words = list(cleaned_words - found_word_strings)
        newly_inserted_words = []

        if missing_words:
            prompt = f"""
            Analyze the following list of words: {', '.join(missing_words)}.
            For each VALID English word, provide the word, a concise definition, an example, and its CEFR level (A1, A2, B1, B2, C1, C2).
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
                        "example": item.example,
                        "word_level": cefr_map.get(item.cefr_level.upper(), 3) 
                    })

                insert_result = await run_in_threadpool(
                    lambda: supabase.table("vocabulary_words")
                    .insert(words_to_insert)
                    .execute()
                )
                newly_inserted_words = insert_result.data

                if newly_inserted_words:
                    texts_to_embed = [f"{row['word']}: {row['definition']}" for row in newly_inserted_words]

                    embedding_response = await openai_client.embeddings.create(
                        model="text-embedding-3-small",
                        input=texts_to_embed
                    )

                    for i, row in enumerate(newly_inserted_words):
                        row["embedding"] = embedding_response.data[i].embedding

                    await run_in_threadpool(
                        lambda: supabase.table("vocabulary_words")
                        .upsert(newly_inserted_words)
                        .execute()
                    )

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

    return [round((res_12 + res_13) / 2, 4), round((res_12 + res_23) / 2, 4), round((res_23 + res_13) / 2, 4)]


@router.post("/relevant-vocabulary-words")
async def calculate_similarity(
    text_input: Dict[str, str], 
    request: Request, 
    supabase=Depends(get_user_client)
):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    input_text = text_input.get("text", "").strip()

    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty")

    try:
        user_vocab_result = await run_in_threadpool(
            lambda: supabase.table("user_vocabulary")
            .select("vocabulary_words(word, embedding)")
            .execute()
        )
        user_vocab_data = user_vocab_result.data

        if not user_vocab_data:
            raise HTTPException(status_code=404, detail="User has no vocabulary words")

        
        valid_words = []
        for item in user_vocab_data:
            word_info = item.get("vocabulary_words")
            if word_info and word_info.get("embedding"):
                valid_words.append({
                    "word": word_info["word"],
                    "embedding": ast.literal_eval(word_info["embedding"])
                })

        if len(valid_words) == 0:
             raise HTTPException(status_code=404, detail="User has no words with generated embeddings yet.")

        # Get the embedding for the input text
        embeddings_result = await openai_client.embeddings.create(
            input=input_text,
            model="text-embedding-3-small"
        )
        
        input_embedding = embeddings_result.data[0].embedding

        similarities = []
        for item in valid_words:
            similarity = 1 - spatial.distance.cosine(input_embedding, item["embedding"])
            similarities.append((item["word"], similarity))

        # Sort by similarity and get top 5
        top_5 = sorted(similarities, key=lambda x: x[1], reverse=True)[:5]

        # Return the top 5 words
        return [{"word": word, "similarity": round(sim, 4)} for word, sim in top_5]

    except HTTPException as http_exception:
        raise http_exception
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/verify-vocabulary-usage")
async def verify_vocabulary_usage(
    payload: VerifyUsageRequest,
    request: Request,
    supabase=Depends(get_user_client)
):
    user = request.session.get('user')
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not payload.text.strip() or not payload.words:
        raise HTTPException(status_code=400, detail="Text and words list cannot be empty.")

    try:
        prompt = f"""
        You are an expert English tutor. Review the following text written by a student:
        
        TEXT:
        "{payload.text}"

        The student was supposed to incorporate the following vocabulary words: {', '.join(payload.words)}.
        
        For each word in the list, evaluate its usage based on:
        1. Does it appear in the text?
        2. Is the semantic meaning preserved and correct within the context?
        3. Is the grammar decently correct?

        Rules for feedback:
        - If the word is used correctly, set is_correct to true and feedback to exactly "yes".
        - If the word is missing or used incorrectly, set is_correct to false and provide a brief (1-2 sentence) explanation in the feedback field on how it could be better used within the context of their specific text. If an explanation isn't helpful, just output "no".
        """

        ai_response = await openai_client.beta.chat.completions.parse(
            model="gpt-4.1-mini-2025-04-14",
            messages=[{"role": "user", "content": prompt}],
            response_format=UsageVerificationResult
        )

        verification_data = ai_response.choices[0].message.parsed
        
        return verification_data.dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify usage: {str(e)}")


@router.post("/sentence-vocabulary-suggestions", response_model=SentenceSimilarityResponse)
async def sentence_vocabulary_suggestions(
    payload: SentenceSimilarityRequest,
    request: Request,
    supabase=Depends(get_user_client)
):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    input_text = payload.text.strip()

    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    
    try:
        # Preserve sentence punctuation/spacing for UI while embedding only trimmed text.
        sentence_chunks = [
            match.group(0)
            for match in re.finditer(r"[^.!?]+[.!?]*\s*", payload.text)
            if match.group(0).strip()
        ]

        if not sentence_chunks:
            raise HTTPException(status_code=400, detail="No valid sentences found in input text")

        sentence_texts = [s.strip() for s in sentence_chunks]

        user_vocab_result = await run_in_threadpool(
            lambda: supabase.table("user_vocabulary")
            .select("vocabulary_words(word, definition, embedding)")
            .eq("user_id", user["user_id"])
            .execute()
        )
        user_vocab_data = user_vocab_result.data or []

        if not user_vocab_data:
            raise HTTPException(status_code=404, detail="User has no vocabulary words")

        valid_words = []
        for item in user_vocab_data:
            word_info = item.get("vocabulary_words")
            embedding_value = word_info.get("embedding") if word_info else None

            if not word_info or not word_info.get("word") or not embedding_value:
                continue

            parsed_embedding = embedding_value
            if isinstance(embedding_value, str):
                try:
                    parsed_embedding = ast.literal_eval(embedding_value)
                except (ValueError, SyntaxError):
                    continue

            if isinstance(parsed_embedding, list) and len(parsed_embedding) > 0:
                valid_words.append({
                    "word": word_info["word"],
                    "definition": word_info.get("definition"),
                    "embedding": parsed_embedding
                })

        if len(valid_words) == 0:
            raise HTTPException(status_code=404, detail="User has no words with generated embeddings yet.")

        sentence_embedding_result = await openai_client.embeddings.create(
            input=sentence_texts,
            model="text-embedding-3-small"
        )

        sentence_embeddings = [item.embedding for item in sentence_embedding_result.data]
        sentence_matches = []

        for sentence_index, (sentence_raw, sentence_embedding) in enumerate(zip(sentence_chunks, sentence_embeddings)):
            best_word = None
            best_definition = None
            best_similarity = -1.0

            for vocab in valid_words:
                similarity = 1 - spatial.distance.cosine(sentence_embedding, vocab["embedding"])
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_word = vocab["word"]
                    best_definition = vocab.get("definition")

            sentence_matches.append({
                "sentence_index": sentence_index,
                "sentence": sentence_raw,
                "suggested_word": best_word,
                "suggested_definition": best_definition,
                "similarity": round(best_similarity, 4) if best_similarity is not None else None,
            })

        top_matches = sorted(
            sentence_matches,
            key=lambda item: item["similarity"] if item["similarity"] is not None else -1,
            reverse=True,
        )[:5]

        top_match_map = {
            item["sentence_index"]: {
                **item,
                "highlight": True,
                "highlight_rank": rank + 1,
            }
            for rank, item in enumerate(top_matches)
        }

        suggestions = []
        for item in sentence_matches:
            highlighted_item = top_match_map.get(item["sentence_index"])
            if highlighted_item:
                suggestions.append({
                    "sentence_index": item["sentence_index"],
                    "sentence": item["sentence"],
                    "highlight": True,
                    "suggested_word": item["suggested_word"],
                    "suggested_definition": item.get("suggested_definition"),
                    "similarity": item["similarity"],
                    "highlight_rank": highlighted_item["highlight_rank"],
                })
            else:
                suggestions.append({
                    "sentence_index": item["sentence_index"],
                    "sentence": item["sentence"],
                    "highlight": False,
                    "suggested_word": None,
                    "suggested_definition": None,
                    "similarity": item["similarity"],
                    "highlight_rank": None,
                })

        return {
            "text": payload.text,
            "suggestions": suggestions
        }

    except HTTPException as http_exception:
        raise http_exception
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process sentence suggestions: {str(e)}")



@router.post("/thesaurus-search", response_model=ThesaurusSearchResponse)
async def thesaurus_search(
    payload: ThesaurusSearchRequest,
    request: Request,
    supabase=Depends(get_user_client)
):
    user = request.session.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    query_text = payload.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        query_embedding_result = await openai_client.embeddings.create(
            input=query_text,
            model="text-embedding-3-small"
        )
        query_embedding = query_embedding_result.data[0].embedding

        word_phrase_result = await run_in_threadpool(
            lambda: supabase.table("word_bank")
            .select("word_phrase, embedding")
            .eq("user_id", user["user_id"])
            .execute()
        )
        word_phrase_data = word_phrase_result.data or []

        user_vocab_result = await run_in_threadpool(
            lambda: supabase.table("user_vocabulary")
            .select("vocabulary_words(word, embedding)")
            .eq("user_id", user["user_id"])
            .execute()
        )
        user_vocab_data = user_vocab_result.data or []

        candidates = []

        for item in word_phrase_data:
            phrase = (item.get("word_phrase") or "").strip()
            embedding_value = item.get("embedding")

            if not phrase or not embedding_value:
                continue

            parsed_embedding = embedding_value
            if isinstance(embedding_value, str):
                try:
                    parsed_embedding = ast.literal_eval(embedding_value)
                except (ValueError, SyntaxError):
                    continue

            if not isinstance(parsed_embedding, list) or len(parsed_embedding) == 0:
                continue

            candidates.append({
                "source": "word_phrase",
                "text": phrase,
                "embedding": parsed_embedding,
            })

        for item in user_vocab_data:
            word_info = item.get("vocabulary_words")
            if not word_info:
                continue

            vocab_word = (word_info.get("word") or "").strip()
            embedding_value = word_info.get("embedding")

            if not vocab_word or not embedding_value:
                continue

            parsed_embedding = embedding_value
            if isinstance(embedding_value, str):
                try:
                    parsed_embedding = ast.literal_eval(embedding_value)
                except (ValueError, SyntaxError):
                    continue

            if not isinstance(parsed_embedding, list) or len(parsed_embedding) == 0:
                continue

            candidates.append({
                "source": "vocabulary_word",
                "text": vocab_word,
                "embedding": parsed_embedding,
            })

        if len(candidates) == 0:
            return {
                "query": query_text,
                "strongest_match": None,
                "top_matches": [],
            }

        scored_matches = []
        for candidate in candidates:
            similarity = 1 - spatial.distance.cosine(query_embedding, candidate["embedding"])
            scored_matches.append({
                "source": candidate["source"],
                "text": candidate["text"],
                "similarity": round(float(similarity), 4),
            })

        scored_matches.sort(key=lambda x: x["similarity"], reverse=True)

        strongest_match = scored_matches[0]
        top_matches = scored_matches[:5]

        return {
            "query": query_text,
            "strongest_match": strongest_match,
            "top_matches": top_matches,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run thesaurus search: {str(e)}")