from fastapi import APIRouter, HTTPException, Request, Depends
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import AIMessage
import prompts

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate")
async def generate_text(messages: list[AIMessage], request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:

        for message in messages:
            if message.role not in ["system", "user", "assistant"]:
                raise HTTPException(status_code=400, detail=f"Invalid role: {message.role}")

        messages.insert(0, AIMessage(role="system", content=prompts.SYSTEM_PROMPT))

        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=messages,
        )
        
        generated_text = response.choices[0].message.content
        
        return {"output": generated_text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
