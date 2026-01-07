from fastapi import APIRouter, HTTPException, Request, Depends
from openai import OpenAI
import os
from dotenv import load_dotenv
from language_tool_python import LanguageTool
from userclient import get_user_client

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/generate-sentence/{phraseID}")
async def user_rewrite_phrases(phraseID: int, supabase=Depends(get_user_client)):
    
    result_phrase = supabase.table("word_bank").select("word_phrase").eq("word_id", phraseID).execute()

    if (not result_phrase) or len(result_phrase.data) == 0:
        return { "error" : "Invalid" }

    try:
        prompt = f"Generate a sentence that excludes the phrase ({result_phrase.data[0]["word_phrase"]}) but naturally encourages its use when the sentence is rewritten."
        
        num_calls = 0

        while num_calls < 3:

            generated_text = openai_client.responses.create(
                model="gpt-4.1-mini-2025-04-14",
                input=prompt
            )

            generated_embeddings = openai_client.embeddings.create(
                input=generated_text.output_text,
                model="text-embedding-3-small"
            )

            is_similar_sentence = supabase.rpc("unique_generated_sentence", {"p_word_id": phraseID, "p_embedding": generated_embeddings.data[0].embedding }).execute()

            if is_similar_sentence.data == False:
                return {"sentence": generated_text.output_text}

            num_calls += 1

        return {"error": "Failed to generate a unique sentence. Try again."}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))