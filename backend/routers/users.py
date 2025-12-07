from fastapi import APIRouter, HTTPException
from database import supabase
from models import User

router = APIRouter(prefix="/users", tags=["Users"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/")
async def get_all_users():
    try:
        result = supabase.table("users").select("*").execute()

        if result:
            return result.data
        
        return {
            "error": "Failed to fetch users!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/")
async def add_user(new_user: User):
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
        raise HTTPException(status_code=400, detail=str(e))
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/{user_id}/{user_name}")
async def change_user_name(user_id: int, user_name: str):
    try:
        result = supabase.table("users").update({
            "user_name": user_name
        }).eq("user_id", user_id).execute()

        if result:
            return {
                "message": f"Username changed for user with id {user_id}"
            }
        
        return {
            "error": f"Failed to change username of user with id {user_id}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# DELETE ---------------------------------------------------------------------------------------------------------------------------------------

@router.delete("/{user_id}")
async def del_user(user_id: int):
    try:
        result = supabase.table("users").delete().eq("user_id", user_id).execute()

        if result:
            return {
                "message": f"User with id {user_id} deleted"
            }
        
        return {
            "error": f"Failed to delete user with id {user_id}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))