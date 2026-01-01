from fastapi import APIRouter, HTTPException, Request
from ollama import Client
import os
from dotenv import load_dotenv

load_dotenv()

ollama_client = Client(
    host="https://ollama.com",
    headers={'Authorization': 'Bearer ' + os.getenv('OLLAMA_API_KEY')}
)

router = APIRouter(prefix="/ai", tags=["AI"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------
@router.get("/rewritephrase/{phrase}")
async def user_rewrite_phrases(phrase: str, request: Request):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        prompt = f"Generate a sentence that excludes the phrase ({phrase}) but naturally encourages its use when the sentence is rewritten."
        
        messages = [
            {
                'role': 'user',
                'content': prompt,
            }
        ]

        response = ollama_client.chat(
            model="gpt-oss:120b",
            messages=messages
        )

        return {"sentence": response["message"]["content"]}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))