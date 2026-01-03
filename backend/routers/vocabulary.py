from userclient import get_user_client
from fastapi import APIRouter, HTTPException, Request, Depends
from database import supabase
from datetime import datetime, timezone, timedelta
from fastapi.concurrency import run_in_threadpool

router = APIRouter(prefix="/vocabulary", tags=["Vocabulary"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("")
async def user_vocabulary(request: Request):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = await run_in_threadpool(lambda: supabase.table("user_vocabulary").select("vocab_word_id, vocabulary_words(word, definition)").eq("user_id", user["user_id"]).order("vocabulary_words.word_id").execute())

        if result:
            return result.data
        
        return {
            "error": f"Failed to fetch vocabulary for user with id {user['user_id']}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@router.get("/dashboard")
async def user_dashboard(supabase=Depends(get_user_client)):
    #user = request.session.get('user')

    #if not user:
        #raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        result = await run_in_threadpool(lambda: supabase.table("user_vocabulary").select("vocab_word_id, word_id, vocabulary_words(word, definition), created_at").order("created_at", desc=True).execute())

        if result:
            if len(result.data) > 0 and datetime.now(timezone.utc) - datetime.fromisoformat(result.data[0]["created_at"].replace("Z", "+00:00")) < timedelta(hours=24):
                flattened = [
                    {
                        "vocab_word_id": row["vocab_word_id"],
                        "word_id": row["word_id"],
                        "word": row["vocabulary_words"]["word"],
                        "definition": row["vocabulary_words"]["definition"]
                    }

                    for row in result.data
                ]

                return flattened
            else:
                new_result = await run_in_threadpool(lambda: supabase.rpc('get_unique_vocabulary_words_for_user', { "limit_count": 3 }).execute())

                if new_result:
                    return new_result.data

        return {
            "error": f"Failed to fetch current vocabulary words for user!"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))