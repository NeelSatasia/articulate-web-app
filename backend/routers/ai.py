from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.concurrency import run_in_threadpool
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import AIMessage, UserRequest, Evaluation, Situation
import prompts
from datetime import datetime, timezone

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate-word-context")
async def generate_text(request: Request, userPrompt: UserRequest, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:

        trimmed_user_response = userPrompt.user_response.strip()

        if request.session["user"]["ai_responses"] >= 3 or request.session["user"]["user_responses"] >= 3 or userPrompt.word_id != request.session["user"]["target_word_id"]:
            request.session["user"]["target_word_id"] = None
            request.session["user"]["target_word"] = None

        target_word = request.session["user"]["target_word"]
        messages = []

        if target_word:
            if len(trimmed_user_response) == 0 or len(trimmed_user_response) > 1000:
                raise HTTPException(status_code=400, detail="User response cannot be empty or greater than 1000 characters when continuing a practice session.")

            request.session["user"]["user_responses"] += 1

        else:
            if len(trimmed_user_response) > 0:
                raise HTTPException(status_code=400, detail="When starting a new practice session, the input must be empty.")
            
            result = await run_in_threadpool(lambda: supabase.table("word_bank")
                                                            .select("word_phrase, success_attempts, failed_attempts, avg_success_attempts, last_attempted_at")
                                                            .eq("word_id", userPrompt.word_id)
                                                            .limit(1)
                                                            .execute()
                                                        )
                        
                        
            if result.data:
                target_word = result.data[0]["word_phrase"]

                request.session["user"]["target_word"] = target_word
                request.session["user"]["target_word_id"] = userPrompt.word_id
                request.session["user"]["situation"] = None
                request.session["user"]["user_responses"] = 0
                request.session["user"]["ai_responses"] = 0
                request.session["user"]["success_attempts"] = result.data[0]["success_attempts"]
                request.session["user"]["failed_attempts"] = result.data[0]["failed_attempts"]
                request.session["user"]["avg_success_attempts"] = result.data[0]["avg_success_attempts"]
            else:
                raise HTTPException(status_code=404, detail="No words found in the user's word bank")

        response = None

        if request.session["user"]["situation"] is None:
            messages.append(AIMessage(role="system", content=prompts.situation_system_prompt(target_word)))

            response = await openai_client.responses.parse(
                model=os.getenv("OPENAI_MODEL"),
                input=messages,
                text_format=Situation,
                temperature=2.0,
                top_p=0.9,
            )

            request.session["user"]["situation"] = response.output_parsed.situation

            return response.output_parsed

        else:
            is_reveal = request.session["user"]["user_responses"] >= 3
            messages.append(AIMessage(role="system", content=prompts.evaluation_prompt(target_word, request.session["user"]["situation"], is_reveal)))
            messages.append(AIMessage(role="user", content=trimmed_user_response))

            response = await openai_client.responses.parse(
                model=os.getenv("OPENAI_MODEL"),
                input=messages,
                text_format=Evaluation,
            )

        
        response = response.output_parsed

        request.session["user"]["ai_responses"] += 1

        if response.correct:
            request.session["user"]["success_attempts"] += 1
            request.session["user"]["avg_success_attempts"] = (request.session["user"]["avg_success_attempts"] + request.session["user"]["user_responses"]) / 2

            await run_in_threadpool(lambda: supabase.table("word_bank")
                                        .update({
                                            "success_attempts": request.session["user"]["success_attempts"],
                                            "avg_success_attempts": request.session["user"]["avg_success_attempts"],
                                            "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                        })
                                        .eq("word_id", request.session["user"]["target_word_id"])
                                        .execute()
                                    )
        else:
            request.session["user"]["failed_attempts"] += 1

            await run_in_threadpool(lambda: supabase.table("word_bank")
                                        .update({
                                            "failed_attempts": request.session["user"]["failed_attempts"],
                                            "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                        })
                                        .eq("word_id", request.session["user"]["target_word_id"])
                                        .execute()
                                    )

        if request.session["user"]["ai_responses"] >= 3 or request.session["user"]["user_responses"] >= 3:
            request.session["user"]["target_word_id"] = None
            request.session["user"]["target_word"] = None


        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
