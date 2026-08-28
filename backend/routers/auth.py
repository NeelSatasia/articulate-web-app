from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from database import supabase
from dotenv import load_dotenv
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
BACKEND_URL = os.getenv("BACKEND_URL")

@router.get("/login")
def login():
    data = supabase.auth.sign_in_with_oauth({
        "provider": "google",
        "options": {
            "redirect_to": f"{BACKEND_URL}/auth/callback"
        }
    })
    
    if data.url:
        return RedirectResponse(url=data.url)
    
    raise HTTPException(status_code=500, detail="Could not generate login URL")


@router.get("/callback")
def callback(request: Request, code: str = None):
    if not code:
        raise HTTPException(status_code=400, detail="No code received")

    try:
        session = supabase.auth.exchange_code_for_session({"auth_code": code})
        
        user = session.user

        user_public_id = supabase.table("users").select("user_id").eq("user_email", user.email).execute()
        
        request.session['user'] = {
            "email": user.email,
            "uuid": user.id,
            "user_id": user_public_id.data[0]["user_id"],
            "access_token": session.session.access_token,
            "refresh_token": session.session.refresh_token,
            "expires_at": session.session.expires_at,
            "target_word": None,
            "situation": None,
            "user_responses": [],
            "ai_responses": []
        }

        return RedirectResponse(f"{FRONTEND_URL}/dashboard")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")
    

@router.get("/logout")
def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url=f"{FRONTEND_URL}")


@router.get("/check")
def check_auth(request: Request):
    user = request.session.get('user')
    
    if user:
        return {"authenticated": True, "user": user}
    
    raise HTTPException(status_code=401, detail="User not authenticated")


@router.put("/target-word-reset")
def reset_target_word(request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    request.session['user']['target_word'] = None
    request.session['user']['situation'] = None
    request.session['user']['user_responses'] = []
    request.session['user']['ai_responses'] = []
    
    return {"message": "Target word and related session data reset successfully."}