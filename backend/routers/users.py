from fastapi import APIRouter, HTTPException
from database import supabase
from models import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
def get_all_users():
    try:
        result = supabase.table("users").select("*").execute()

        if result:
            return result.data
        
        return {
            "error": "Failed to fetch users!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/new")
def add_user(new_user: User):
    try:
        result = supabase.table("users").insert({
            "user_name": new_user.user_name,
            "user_email": new_user.user_email
        }).execute()

        if result:
            return {
                "message": f"New user added"
            }
        
        return {
            "error": "Failed to add a new user!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    