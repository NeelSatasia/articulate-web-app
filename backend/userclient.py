import os
import time
from fastapi import Request, HTTPException
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

async def get_user_client(request: Request) -> Client:
    user_session = request.session.get("user")
    
    if not user_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = user_session.get("access_token")
    refresh_token = user_session.get("refresh_token")
    expires_at = user_session.get("expires_at", 0)
    
    if not token:
        raise HTTPException(status_code=401, detail="No access token found")

    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # Check if token is expired or about to expire (within 60 seconds)
    if time.time() > (expires_at - 60):
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Session expired and no refresh token available")
        
        try:
            # Ask Supabase to refresh the session using the old tokens
            auth_response = client.auth.set_session(token, refresh_token)
            
            # Update the FastAPI session with the new, fresh tokens
            new_session = auth_response.session
            user_session["access_token"] = new_session.access_token
            user_session["refresh_token"] = new_session.refresh_token
            user_session["expires_at"] = new_session.expires_at
            
            request.session["user"] = user_session
            
            # Use the brand new access token for this current request
            token = new_session.access_token
            
        except Exception as e:
            # If the refresh token itself is expired or revoked, clear the session and force login
            request.session.pop("user", None)
            raise HTTPException(status_code=401, detail="Session completely expired. Please log in again.")

    # Apply the valid token to PostgREST for RLS
    client.postgrest.auth(token)
    
    return client