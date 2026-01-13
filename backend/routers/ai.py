from fastapi import APIRouter, HTTPException, Request, Depends
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import GrammarReview
from fastapi.concurrency import run_in_threadpool

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