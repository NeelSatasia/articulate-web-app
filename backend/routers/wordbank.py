from fastapi import APIRouter
from database import supabase

router = APIRouter(prefix="/users", tags=["Word Bank"])

