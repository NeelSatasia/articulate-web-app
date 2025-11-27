from fastapi import APIRouter
from database import supabase

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
def get_all_users():
    return supabase.table("test").select("*").execute().data

@router.post("/new")
def add_user():
    return supabase.table("test").insert({
        "name": "Neel"
    }).execute().data