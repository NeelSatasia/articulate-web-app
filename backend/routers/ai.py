from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.concurrency import run_in_threadpool
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv
from userclient import get_user_client
from models import AIMessage, UserRequest, Evaluation, Situation, TargetWord
import prompts
from datetime import datetime, timezone
import random
from limiter import limiter
from redis_client import get_redis

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])


# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/generate-situation")
@limiter.limit("2/minute")
async def generate_situation(request: Request, supabase=Depends(get_user_client), redis=Depends(get_redis)):

    try:
        response = await run_in_threadpool(lambda: supabase.rpc("update_user_ai_usage").execute())
        
        new_usage = response.data

        if new_usage is None:
            raise HTTPException(status_code=429, detail="AI usage limit reached. Please wait until the next day.")

        random_situation_id = random.randint(1, 1_450_145)

        situation_constraints = await run_in_threadpool(lambda: supabase 
                                .table("context_combinations")
                                .select("""
                                    activities(activity),
                                    problems(problem),
                                    settings(setting)
                                """) 
                                .eq("combination_id", random_situation_id) 
                                .single()
                                .execute())

        activity = situation_constraints.data["activities"]["activity"]
        problem = situation_constraints.data["problems"]["problem"]
        setting = situation_constraints.data["settings"]["setting"]

        messages = [AIMessage(role="system", content=prompts.situation_system_prompt(activity, problem, setting))]

        response = await openai_client.responses.parse(
            model=os.getenv("OPENAI_MODEL"),
            input=messages,
            text_format=Situation,
            temperature=0.5,
        )

        return response.output_parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/generate-situation")
@limiter.limit("3/minute")
async def generate_situation(request: Request, target_word: TargetWord, supabase=Depends(get_user_client), redis=Depends(get_redis)):

    user_id = request.session.get("user")["user_id"]

    try:
        response = await run_in_threadpool(lambda: supabase.rpc("update_user_ai_usage").execute())

        new_usage = response.data

        if new_usage is None:
            raise HTTPException(status_code=429, detail="AI usage limit reached. Please wait until the next day.")

        result_word = await run_in_threadpool(lambda: supabase.table("word_bank")
                                                            .select("word_phrase, success_attempts, failed_attempts, avg_success_attempts, last_attempted_at")
                                                            .eq("word_id", target_word.word_id)
                                                            .single()
                                                            .execute()
                                                        )


        random_situation_type = random.randint(1, 3)
        random_constraint_id = 0
        table_name = ""
        constraint_type = ""
        constraint_type_id_name = ""

        if random_situation_type == 1:
            random_constraint_id = random.randint(1, 137)
            table_name = "activities"
            constraint_type = "activity"
            constraint_type_id_name = "activity_id"

        elif random_situation_type == 2:
            random_constraint_id = random.randint(1, 145)
            table_name = "problems"
            constraint_type = "problem"
            constraint_type_id_name = "problem_id"

        elif random_situation_type == 3:
            random_constraint_id = random.randint(1, 73)
            table_name = "settings"
            constraint_type = "setting"
            constraint_type_id_name = "setting_id"

        situation = ""
        new_target_word = ""

        if result_word.data:

            situation_constraint = await run_in_threadpool(lambda: supabase 
                        .table(table_name)
                        .select(constraint_type) 
                        .eq(constraint_type_id_name, random_constraint_id) 
                        .single()
                        .execute())

            situation = situation_constraint.data[constraint_type]

            new_target_word = result_word.data["word_phrase"]
        else:
            raise HTTPException(status_code=404, detail="Target word not found in the user's word bank")

        if situation:
            messages = [AIMessage(role="system", content=prompts.target_word_situation_system_prompt(new_target_word, constraint_type, situation))]
        else:
            raise HTTPException(status_code=404, detail="No situation constraints found for the given word")

        response = await openai_client.responses.parse(
            model=os.getenv("OPENAI_MODEL"),
            input=messages,
            text_format=Situation
        )

        await redis.mset({
            f"user:{user_id}:situation": response.output_parsed.situation,
            f"user:{user_id}:target_word_id": target_word.word_id,
            f"user:{user_id}:attempts": 0,
            f"user:{user_id}:target_word": result_word.data['word_phrase'],
            f"user:{user_id}:success_attempts": result_word.data['success_attempts'],
            f"user:{user_id}:failed_attempts": result_word.data['failed_attempts'],
            f"user:{user_id}:avg_success_attempts": result_word.data['avg_success_attempts']
        })

        return response.output_parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/validate-user-response")
@limiter.limit("5/minute")
async def generate_text(request: Request, userPrompt: UserRequest, supabase=Depends(get_user_client), redis=Depends(get_redis)):

    user_id = request.session.get("user")["user_id"]

    try:
        trimmed_user_response = userPrompt.user_response.strip()

        if len(trimmed_user_response) == 0 or len(trimmed_user_response) > 1000:
            raise HTTPException(status_code=400, detail="User response cannot be empty or greater than 1000 characters when continuing a practice session.")

        user_ai_usage = await run_in_threadpool(lambda: supabase.table("users").select("ai_usage_tracker").execute())

        if user_ai_usage.data and user_ai_usage.data[0]["ai_usage_tracker"] >= 30:
            raise HTTPException(status_code=429, detail="AI usage limit reached. Please wait until the next day.")

        user_practice_session_info = await redis.mget(
                                                    f"user:{user_id}:situation",
                                                    f"user:{user_id}:target_word_id",
                                                    f"user:{user_id}:attempts",
                                                    f"user:{user_id}:target_word",
                                                    f"user:{user_id}:success_attempts",
                                                    f"user:{user_id}:failed_attempts",
                                                    f"user:{user_id}:avg_success_attempts")


        target_word = user_practice_session_info[3]
        situation = user_practice_session_info[0]
        attempts = user_practice_session_info[2]

        if not target_word or not situation or not attempts:
            raise HTTPException(status_code=400, detail="No active practice session found. Please start a new session.")

        attempts = int(attempts)

        if attempts + 1 > 3:
            raise HTTPException(status_code=400, detail="Maximum attempts reached for this practice session. Please start a new session.")

        else:
            attempts += 1
            await redis.set(f"user:{user_id}:attempts", attempts)


        messages = []

        is_reveal = attempts >= 3

        messages.append(AIMessage(role="system", content=prompts.evaluation_prompt(target_word, situation, is_reveal)))
        messages.append(AIMessage(role="user", content=trimmed_user_response))

        response = await openai_client.responses.parse(
            model=os.getenv("OPENAI_MODEL"),
            input=messages,
            text_format=Evaluation,
        )
        
        response = response.output_parsed
        
        if response.correct == True:
            await run_in_threadpool(lambda: supabase.table("word_bank")
                                        .update({
                                            "success_attempts": int(user_practice_session_info[4]) + 1,
                                            "avg_success_attempts": (int(user_practice_session_info[6]) + attempts) / 2,
                                            "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                        })
                                        .eq("word_id", user_practice_session_info[1])
                                        .execute()
                                    )

        else:
            await run_in_threadpool(lambda: supabase.table("word_bank")
                                        .update({
                                            "failed_attempts": int(user_practice_session_info[5]) + 1,
                                            "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                        })
                                        .eq("word_id", int(user_practice_session_info[1]))
                                        .execute()
                                    )

        if response.correct or is_reveal:
            await redis.unlink(
                            f"user:{user_id}:situation",
                            f"user:{user_id}:target_word_id",
                            f"user:{user_id}:attempts",
                            f"user:{user_id}:target_word",
                            f"user:{user_id}:success_attempts",
                            f"user:{user_id}:failed_attempts",
                            f"user:{user_id}:avg_success_attempts")

        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
