from fastapi import APIRouter, HTTPException, Request
from database import supabase
from typing import Dict, List

router = APIRouter(prefix="/wordbank", tags=["Word Bank"])

REDIRECT_URI = "http://localhost:5173"

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("")
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
    
@router.get("/dashboard")
async def current_word_phrases(request: Request):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:

        result = supabase.rpc('get_current_dashboard_word_phrases', { "p_user_id": user["user_id"], "limit_count": 5 }).execute()

        if result:
            return result.data
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/word-phrases")
async def new_word_phrases(new_data: Dict[int, List[str]], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        rows = []
        
        for word_category_id, word_phrases in new_data.items():
            for word_phrase in word_phrases:
                rows.append({
                        "user_id": user["user_id"],
                        "word_category_id": word_category_id,
                        "word_phrase": word_phrase
                    })
                
        if rows:
            resp_data = supabase.table("word_bank").insert(rows).execute()

            if resp_data:
                return resp_data.data
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/categories")
async def new_user_word_categories(new_word_categories: List[str], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = supabase.table("word_category").insert([
            {"user_id": user["user_id"], "word_category": category}
            for category in new_word_categories
        ]).execute()

        return result
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/word-phrases")
async def edit_word_phrases(modified_data: Dict[int, Dict[int, str]], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        word_ids = []
        category_ids = []
        phrases = []
        
        for word_category_id, word_phrases in modified_data.items():
            cat_id = int(word_category_id)
            
            for word_id, word_phrase in word_phrases.items():
                word_ids.append(int(word_id))
                category_ids.append(cat_id)
                phrases.append(word_phrase)

        supabase.rpc("update_word_phrases", {
                "p_user_id": user["user_id"],
                "p_word_ids": word_ids,
                "p_category_ids": category_ids,
                "p_phrases": phrases
            }).execute()



    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.put("/categories")
async def edit_word_categories(modified_data: Dict[int, str], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        category_ids = []
        updated_category_names = []
        
        for word_category_id, new_category_name in modified_data.items():
            category_ids.append(word_category_id)
            updated_category_names.append(new_category_name)

        supabase.rpc("update_word_categories", {
                "p_user_id": user["user_id"],
                "p_category_ids": category_ids,
                "p_category_names": updated_category_names
            }).execute()

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# DELETE ---------------------------------------------------------------------------------------------------------------------------------------

@router.delete("/word-phrases")
async def del_word_phrases(delete_data: List[int], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        supabase.table("word_bank").delete().in_("word_id", delete_data).eq("user_id", user["user_id"]).execute()
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@router.delete("/categories")
async def del_word_categories(word_category_ids: List[int], request: Request):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        supabase.table("word_category").delete().in_("word_category_id", word_category_ids).eq("user_id", user["user_id"]).execute()
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))