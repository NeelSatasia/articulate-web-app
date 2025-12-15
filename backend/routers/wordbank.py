from fastapi import APIRouter, HTTPException, Request
from database import supabase
from models import WordPhrase

router = APIRouter(prefix="/wordbank", tags=["Word Bank"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/")
async def user_word_bank(request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_bank").select("word_id, word_category_id, word_phrase").eq("user_id", user["user_id"]).order("word_category_id").execute()

            if result:
                return result.data
            
            return {
                "error": f"Failed to fetch word bank of user with id {user["user_id"]}!"
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    return {
        "message": "User not signed in!"
    }

   
@router.get("/categories")
async def user_word_categories(request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_category").select("word_category_id, word_category").eq("user_id", user["user_id"]).execute()

            if result:
                return result.data
            
            return {
                "error": f"Failed to fetch word categories for user with id {user["user_id"]}"
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "User not signed in!"
    }
    
# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/word-phrase")
async def new_user_word(new_word_phrase: WordPhrase, request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_bank").insert({
                "user_id": user["user_id"],
                "word_category_id": new_word_phrase.word_category_id,
                "word_phrase": new_word_phrase.word_phrase
            }).execute()

            if result:
                return {
                    "message": f"New word added for user with id {user["user_id"]}",
                    "new_data" : result.data[0]
                }

            return {
                "error": f"Failed to add a new word/phrase for user id {user["user_id"]}"
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "User not signed in!"
    }
    

@router.post("/category")
async def new_user_word_cateogory(new_word_category: str, request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_category").insert({
                "user_id": user["user_id"],
                "word_category": new_word_category
            }).execute()

            if result:
                return {
                    "message": f"New word category added for user with id {user["user_id"]}"
                }

            return {
                "error": f"Failed to add a new category for user id {user["user_id"]}!"
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "User not signed in!"
    }
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/word-phrase/{word_id}")
async def edit_word_phrase(word_id: int, word_phrase: WordPhrase, request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_bank").update({
                "word_phrase": word_phrase.word_phrase,
                "word_category_id": word_phrase.word_category_id
            }).eq("word_id", word_id).eq("user_id", user["user_id"]).execute()

            if result:
                return {
                    "message": f"A word-phrase updated for user with id {user["user_id"]}"
                }

            return {
                "error": f"Failed to update a word-phrase for user id {user["user_id"]}!"
            }

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    return {
        "message": "User not signed in!"
    }
    

@router.put("/category/{word_category_id}")
async def edit_word_category(word_category_id: int, word_category: str, request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_category").update({
                "word_category": word_category
            }).eq("word_category_id", word_category_id).eq("user_id", user["user_id"]).execute()

            if result:
                return {
                    "message": f"A word-category updated for user with id {user["user_id"]}"
                }

            return {
                "error": f"Failed to update a word-category for user id {user["user_id"]}!"
            }

        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "User not signed in!"
    }
    
# DELETE ---------------------------------------------------------------------------------------------------------------------------------------

@router.delete("/word-phrase/{word_id}")
async def del_word_phrase(word_id: int, request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_bank").delete().eq("word_id", word_id).eq("user_id", user["user_id"]).execute()

            if result:
                return {
                    "message": f"A word-phrase deleted"
                }

            return {
                "error": f"Failed to delete a word-phrase!"
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "User not signed in!"
    }
    
    
@router.delete("/category/{word_category_id}")
async def del_word_category(word_category_id: int, request: Request):
    user = request.session.get('user')
    
    if user:
        try:
            result = supabase.table("word_category").delete().eq("word_category_id", word_category_id).eq("user_id", user["user_id"]).execute()

            if result:
                return {
                    "message": f"A word-category deleted"
                }

            return {
                "error": f"Failed to delete a word-category!"
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    return {
        "message": "User not signed in!"
    }