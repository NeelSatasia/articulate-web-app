from fastapi import APIRouter, HTTPException, Request, Depends, Body
from fastapi.concurrency import run_in_threadpool
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import AIMessage
import prompts
from datetime import datetime, timezone

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate")
async def generate_text(request: Request, user_response: str = Body(..., media_type="text/plain"), supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:

        target_word = request.session["user"]["target_word"]
        messages = []

        if target_word:

            request.session["user"]["user_responses"].append(user_response)

            user_responses = request.session["user"]["user_responses"]
            ai_responses = request.session["user"]["ai_responses"]

            situation = request.session["user"]["situation"]

            if situation:
                messages.append(AIMessage(role="assistant", content=situation))
            else:
                raise HTTPException(status_code=400, detail="Situation not found")

            for i in range(len(user_responses)):
                messages.append(AIMessage(role="user", content=user_responses[i]))

                if i < len(ai_responses):
                    messages.append(AIMessage(role="assistant", content=ai_responses[i]))

        else:
            if len(user_response.strip()) > 0:
                raise HTTPException(status_code=400, detail="When starting a new practice session, the input must be empty.")
            
            result = await run_in_threadpool(lambda: supabase.table("word_bank")
                                                            .select("word_id, word_phrase, success_attempts, failed_attempts, avg_success_attempts, last_attempted_at")
                                                            .order("success_attempts", desc=False)
                                                            .order("failed_attempts", desc=True)
                                                            .order("avg_success_attempts", desc=True)
                                                            .order("last_attempted_at", desc=False)
                                                            .limit(1)
                                                            .execute()
                                                        )
                        
                        
            if result.data:
                target_word = result.data[0]["word_phrase"]

                request.session["user"]["target_word"] = target_word
                request.session["user"]["situation"] = None
                request.session["user"]["user_responses"] = []
                request.session["user"]["ai_responses"] = []
            else:
                raise HTTPException(status_code=404, detail="No words found in the user's word bank")

        messages.insert(0, AIMessage(role="system", content=prompts.system_prompt(target_word)))
        
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=messages,
        )
        
        generated_text = response.choices[0].message.content
        
        if request.session["user"]["situation"] is None:
            request.session["user"]["situation"] = generated_text
        else:
            request.session["user"]["ai_responses"].append(generated_text)

        messages.append(AIMessage(role="assistant", content=generated_text))

        if len(request.session["user"]["ai_responses"]) == 3 or generated_text.strip().lower() == "correct":
            original_word_data = await run_in_threadpool(lambda: supabase.table("word_bank")
                                                        .select("success_attempts, failed_attempts, avg_success_attempts")
                                                        .eq("word_phrase", target_word)
                                                        .execute()
                                                    )
            if original_word_data.data:
                original_word = original_word_data.data[0]

                if generated_text.strip().lower() == "correct":
                    await run_in_threadpool(lambda: supabase.table("word_bank")
                                                .update({
                                                    "success_attempts": original_word["success_attempts"] + 1,
                                                    "avg_success_attempts": (original_word["avg_success_attempts"] + 1) / 2,
                                                    "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                                })
                                                .eq("word_phrase", target_word)
                                                .execute()
                                            )
                else:
                    await run_in_threadpool(lambda: supabase.table("word_bank")
                                                .update({
                                                    "failed_attempts": original_word["failed_attempts"] + 1,
                                                    "avg_success_attempts": (original_word["avg_success_attempts"] + 1) / 2,
                                                    "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                                })
                                                .eq("word_phrase", target_word)
                                                .execute()
                                            )
            else:
                raise HTTPException(status_code=404, detail=f"Word '{target_word}' not found in the user's word bank")

            request.session["user"]["target_word"] = None
            request.session["user"]["situation"] = None
            request.session["user"]["user_responses"] = []
            request.session["user"]["ai_responses"] = []


        if len(messages) == 2:
            return [AIMessage(role="assistant", content=f"Your target word is: {target_word}"), messages[1]]

        return [messages[-1]]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
