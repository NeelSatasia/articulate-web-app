from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from database import supabase

router = APIRouter(prefix="/auth", tags=["Auth"])

REDIRECT_FRONTEND_URL = "http://localhost:5173"

@router.get("/login")
def login():
    data = supabase.auth.sign_in_with_oauth({
        "provider": "google",
        "options": {
            "redirect_to": "http://localhost:8000/auth/callback"
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
            "public_id": user_public_id.data[0]["user_id"],
            "access_token": session.session.access_token 
        }

        return RedirectResponse(f"{REDIRECT_FRONTEND_URL}/dashboard")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")
    

@router.get("/logout")
def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url=f"{REDIRECT_FRONTEND_URL}")