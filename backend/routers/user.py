from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.concurrency import run_in_threadpool
from userclient import get_user_client

router = APIRouter(prefix="/user", tags=["User"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("")
async def get_user(supabase=Depends(get_user_client)):
    try:
        result = await run_in_threadpool(lambda: supabase.table("users").select("daily_recall_email").execute())

        if result:
            return result.data
        
        return {
            "error": "Failed to fetch user's config data!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/daily_recall_email/{is_daily_recall_email}")
async def set_daily_recall_email(is_daily_recall_email: bool, request: Request, supabase=Depends(get_user_client)):

    user = request.session.get("user")

    try:
        await run_in_threadpool(lambda: supabase.table("users").update({"daily_recall_email": is_daily_recall_email}).eq("user_id", user["user_id"]).execute())
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))