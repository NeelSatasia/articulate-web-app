from fastapi import APIRouter, HTTPException
from database import supabase
from models import WordPhrase, WordCategory

router = APIRouter(prefix="/wordbank", tags=["Word Bank"])

@router.get("/{user_id}")
def user_word_bank(user_id: int):
    try:
        result = supabase.table("word_bank").select("word_phrase").eq("user_id", user_id).execute()

        if result:
            return result.data
        
        return {
            "message": f"Failed to fetch word bank of user with id {user_id}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/new-word")
def new_user_word(new_word_phrase: WordPhrase):
    try:
        result = supabase.table("word_bank").insert({
            "user_id": new_word_phrase.user_id,
            "word_category_id": new_word_phrase.word_category_id,
            "word_phrase": new_word_phrase.word_phrase
        }).execute()

        if result:
            return {
                "message": f"New word added for user with id {new_word_phrase.user_id}"
            }

        return {
            "message": f"Failed to add a new word/phrase for user id {new_word_phrase.user_id}:"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/new-category")
def new_user_word_cateogory(new_word_category: WordCategory):
    try:
        result = supabase.table("word_category").insert({
            "user_id": new_word_category.user_id,
            "word_category": new_word_category.word_category
        }).execute()

        if result:
            return {
                "message": f"New word category added for user with id {new_word_category.user_id}"
            }

        return {
            "message": f"Failed to add a new category for user id {new_word_category.user_id}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))