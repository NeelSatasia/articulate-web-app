from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from database import supabase
from dotenv import load_dotenv
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5173"

oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'redirect_uri': 'http://localhost:8000/auth'
    }
)


@router.get("")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        return {"error": "OAuth handshake failed", "details": str(e)}

    user = token.get('userinfo')
    
    if user:
        response = supabase.table("users").select("user_id").eq("user_email", user.get("email")).execute()
        
        internal_user_id = None
        
        if response.data and len(response.data) > 0:
            internal_user_id = response.data[0]['user_id']
        else:
            new_user = supabase.table("users").insert({
                "user_name": user.get("name"),
                "user_email": user.get("email")
                }).execute()
            internal_user_id = new_user.data[0]['user_id']

        session_data = {
            "google_sub": user.get("sub"),
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
            "user_id": internal_user_id
        }
        
        request.session['user'] = session_data
    
    return RedirectResponse(url=REDIRECT_URI + "/wordbank")

@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/logout")
def logout(request: Request):
    request.session.pop('user', None)
    return RedirectResponse(url=REDIRECT_URI)