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

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/ai", tags=["AI"])


# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/generate-situation")
async def generate_situation(request: Request, supabase=Depends(get_user_client)):
    user = request.session.get("user")

    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

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
async def generate_situation(request: Request, target_word: TargetWord, supabase=Depends(get_user_client)):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

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

        await run_in_threadpool(lambda: supabase.table("users").update({"situation": response.output_parsed.situation, "target_word_id": target_word.word_id, "attempts": 0}).not_.is_("user_id", "null").execute())

        return response.output_parsed

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/validate-user-response")
async def generate_text(request: Request, userPrompt: UserRequest, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        trimmed_user_response = userPrompt.user_response.strip()

        if len(trimmed_user_response) == 0 or len(trimmed_user_response) > 1000:
            raise HTTPException(status_code=400, detail="User response cannot be empty or greater than 1000 characters when continuing a practice session.")

        user_ai_usage = await run_in_threadpool(lambda: supabase.table("users").select("ai_usage_tracker").execute())

        if user_ai_usage.data and user_ai_usage.data[0]["ai_usage_tracker"] >= 30:
            raise HTTPException(status_code=429, detail="AI usage limit reached. Please wait until the next day.")

        cur_situation = await run_in_threadpool(lambda: supabase.rpc("increment_situation_attempts").execute())

        target_word = None
        situation = None

        if cur_situation.data:
            target_word = cur_situation.data[0]["word_bank"]["word_phrase"]
            situation = cur_situation.data[0]["situation"]

        else:
            raise HTTPException(status_code=400, detail="No active practice session found. Please start a new session.")

        messages = []

        response = None

        is_reveal = cur_situation.data[0]["attempts"] >= 3

        messages.append(AIMessage(role="system", content=prompts.evaluation_prompt(target_word, situation, is_reveal)))
        messages.append(AIMessage(role="user", content=trimmed_user_response))

        response = await openai_client.responses.parse(
            model=os.getenv("OPENAI_MODEL"),
            input=messages,
            text_format=Evaluation,
        )
        
        response = response.output_parsed

        cur_word_data = await run_in_threadpool(lambda: supabase.table("word_bank").select("success_attempts, failed_attempts, avg_success_attempts").eq("word_id", cur_situation.data[0]["target_word_id"]).single().execute())
        
        if response.correct == True:
            await run_in_threadpool(lambda: supabase.table("word_bank")
                                        .update({
                                            "success_attempts": cur_word_data.data["success_attempts"] + 1,
                                            "avg_success_attempts": (cur_word_data.data["avg_success_attempts"] + cur_situation.data[0]["attempts"]) / 2,
                                            "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                        })
                                        .eq("word_id", cur_situation.data[0]["target_word_id"])
                                        .execute()
                                    )

            await run_in_threadpool(lambda: supabase.table("users")
                                        .update({"situation": None, "target_word_id": None})
                                        .not_.is_("user_id", "null")
                                        .execute()
                                    )

        else:
            await run_in_threadpool(lambda: supabase.table("word_bank")
                                        .update({
                                            "failed_attempts": cur_word_data.data["failed_attempts"] + 1,
                                            "last_attempted_at": datetime.now(timezone.utc).isoformat()
                                        })
                                        .eq("word_id", cur_situation.data[0]["target_word_id"])
                                        .execute()
                                    )
        

        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
