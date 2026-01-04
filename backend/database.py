from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, ANON_KEY]):
    raise EnvironmentError("One or more Supabase environment variables are missing!")


supabase: Client = create_client(SUPABASE_URL, ANON_KEY)