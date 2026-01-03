import os
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
    
    if not token:
        raise HTTPException(status_code=401, detail="No access token found")

    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    client.postgrest.auth(token)
    
    return client