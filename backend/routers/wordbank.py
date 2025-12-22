from fastapi import APIRouter, HTTPException, Request
from database import supabase
from typing import Dict, List

router = APIRouter(prefix="/wordbank", tags=["Word Bank"])

REDIRECT_URI = "http://localhost:5173"

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("/")
async def user_word_bank(request: Request):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = supabase.table("word_bank").select("word_id, word_category_id, word_phrase").eq("user_id", user["user_id"]).order("word_category_id").execute()

        if result:
            return result.data
        
        return {
            "error": f"Failed to fetch word bank of user with id {user["user_id"]}!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

   
@router.get("/categories")
async def user_word_categories(request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = supabase.table("word_category").select("word_category_id, word_category").eq("user_id", user["user_id"]).execute()

        if result:
            return result.data
        
        return {
            "error": f"Failed to fetch word categories for user with id {user["user_id"]}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/word-phrases")
async def new_user_word(new_data: Dict[int, List[str]], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        inserted_data = []
        
        for word_category_id, word_phrases in new_data.items():
            for word_phrase in word_phrases:
                resp_data = supabase.table("word_bank").insert({
                        "user_id": user["user_id"],
                        "word_category_id": word_category_id,
                        "word_phrase": word_phrase
                    }).execute()
                
                if resp_data:

                    inserted_data.append(resp_data.data[0])


        return inserted_data
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/categories")
async def new_user_word_cateogory(new_word_categories: List[str], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        inserted_data = []

        for new_word_category in new_word_categories:
            resp = supabase.table("word_category").insert({
                "user_id": user["user_id"],
                "word_category": new_word_category
            }).execute()

            if resp:
                inserted_data.append(resp.data[0])

        return inserted_data
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/word-phrases")
async def edit_word_phrase(modified_data: Dict[int, Dict[int, str]], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        for word_category_id, word_phrases in modified_data.items():
            for word_id, word_phrase in word_phrases.items():
                supabase.table("word_bank").update({
                    "word_phrase": word_phrase,
                    "word_category_id": word_category_id
                }).eq("word_id", word_id).eq("user_id", user["user_id"]).execute()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.put("/categories")
async def edit_word_category(modified_data: Dict[int, str], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        for word_category_id, new_category_name in modified_data.items():
            supabase.table("word_category").update({
                "word_category": new_category_name
            }).eq("word_category_id", word_category_id).eq("user_id", user["user_id"]).execute()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# DELETE ---------------------------------------------------------------------------------------------------------------------------------------

@router.delete("/word-phrases")
async def del_word_phrase(delete_data: List[int], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        for word_phrase_id in delete_data:
            supabase.table("word_bank").delete().eq("word_id", word_phrase_id).eq("user_id", user["user_id"]).execute()
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@router.delete("/categories")
async def del_word_category(word_category_ids: List[int], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        for word_category_id in word_category_ids:
            supabase.table("word_category").delete().eq("word_category_id", word_category_id).eq("user_id", user["user_id"]).execute()
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))