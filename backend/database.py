from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()  # Load variables from .env

SUPABASE_URL = os.getenv("SUPABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

if not all([SUPABASE_URL, SECRET_KEY]):
    raise EnvironmentError("One or more Supabase environment variables are missing!")


supabase: Client = create_client(SUPABASE_URL, SECRET_KEY)