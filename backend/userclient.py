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

    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    return client