from userclient import get_user_client
from fastapi import APIRouter, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool
import random

router = APIRouter(prefix="/prompts", tags=["Prompts"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("")
async def prompts(supabase=Depends(get_user_client)):
    
    try:
        result = await run_in_threadpool(lambda: supabase.table("prompts").select("*").execute())

        if result:
            random.shuffle(result.data)
            return result.data
        
        return {
            "error": f"Failed to fetch prompts for user!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))