from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://localhost:8000/auth"

oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile',
        'redirect_uri': REDIRECT_URI
    }
)


@router.get("")
async def auth(request: Request):
    # Google redirects back here with a code
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        return {"error": "OAuth handshake failed", "details": str(e)}

    # Extract user info from the token
    user = token.get('userinfo')
    
    # Store user in session (simple cookie-based session)
    if user:
        request.session['user'] = user
    
    return RedirectResponse(url=REDIRECT_URI)

@router.get("/login")
async def login(request: Request):
    # Redirect user to Google Auth URL
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/logout")
def logout(request: Request):
    # Clear session
    request.session.pop('user', None)
    return RedirectResponse(url=REDIRECT_URI)