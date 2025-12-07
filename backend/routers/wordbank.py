from fastapi import APIRouter, HTTPException
from database import supabase
from models import WordPhrase, WordCategory

router = APIRouter(prefix="/wordbank", tags=["Word Bank"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/{user_id}")
def user_word_bank(user_id: int):
    try:
        result = supabase.table("word_bank").select("word_id, word_category_id, word_phrase").eq("user_id", user_id).execute()

        if result:
            return result.data
        
        return {
            "message": f"Failed to fetch word bank of user with id {user_id}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

   
@router.get("/categories/{user_id}")
def user_word_categories(user_id: int):
    try:
        result = supabase.table("word_category").select("word_category_id, word_category").eq("user_id", user_id).execute()

        if result:
            return result.data
        
        return {
            "message": f"Failed to fetch word categories for user with id {user_id}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/word-phrase")
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
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/category")
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
        raise HTTPException(status_code=400, detail=str(e))
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/word-phrase/{word_id}")
def edit_word_phrase(word_id: int, word_phrase: WordPhrase):
    try:
        result = supabase.table("word_bank").update({
            "word_phrase": word_phrase.word_phrase,
            "word_category_id": word_phrase.word_category_id
        }).eq("word_id", word_id).execute() # TODO: ensure only authorized user can access his/her word_id

        if result:
            return {
                "message": f"A word-phrase updated for user with id {word_phrase.user_id}"
            }

        return {
            "message": f"Failed to update a word-phrase for user id {word_phrase.user_id}!"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.put("/category/{word_category_id}")
def edit_word_category(word_category_id: int, word_category: WordCategory):
    try:
        result = supabase.table("word_category").update({
            "word_category": word_category.word_category
        }).eq("word_category_id", word_category_id).execute() # TODO: ensure only authorized user can access his/her word_category_id

        if result:
            return {
                "message": f"A word-category updated for user with id {word_category.user_id}"
            }

        return {
            "message": f"Failed to update a word-category for user id {word_category.user_id}!"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    