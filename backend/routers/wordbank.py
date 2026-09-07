from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, List
from fastapi.concurrency import run_in_threadpool
from userclient import get_user_client

router = APIRouter(prefix="/wordbank", tags=["Word Bank"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("")
async def user_word_bank(request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')

    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    try:
        result = await run_in_threadpool(lambda: supabase.table("word_bank").select("word_id, word_category_id, word_phrase, success_attempts, failed_attempts, avg_success_attempts, last_attempted_at").order("word_category_id").execute())

        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

   
@router.get("/categories")
async def user_word_categories(request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        result = await run_in_threadpool(lambda: supabase.table("word_category").select("word_category_id, word_category").execute())

        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# POST ---------------------------------------------------------------------------------------------------------------------------------------

@router.post("/categories")
async def new_user_word_categories(new_word_categories: List[str], request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    try:
        for category in new_word_categories:
            category = category.strip()

            if len(category) == 0 or len(category) > 30:
                raise HTTPException(status_code=400, detail=f"A category name cannot be empty or have more than 30 characters long.")
        
        result = await run_in_threadpool(lambda: supabase.table("word_category").insert([
            {"user_id": user["user_id"], "word_category": category}
            for category in new_word_categories
        ]).execute())

        return result.data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/word-phrases")
async def new_user_word_phrases(new_word_phrases: Dict[int, List[str]], request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")

    try:
        records = []
        
        for category_id, phrases in new_word_phrases.items():

            for phrase in phrases:
                phrase = phrase.strip().lower()

                if len(phrase) <= 3 or len(phrase) > 15:
                    raise HTTPException(status_code=400, detail=f"A word must be between 4 to 15 characters long.")

                if not phrase.isalpha():
                    raise HTTPException(status_code=400, detail=f"Words must contain only alphabetic characters.")
                
                records.append({
                    "user_id": user["user_id"],
                    "word_category_id": category_id,
                    "word_phrase": phrase
                })

        if not records:
            return []

        result = await run_in_threadpool(lambda: supabase.table("word_bank").insert(records).execute())

        return result.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# PUT ---------------------------------------------------------------------------------------------------------------------------------------

@router.put("/categories")
async def edit_word_categories(request: Request, modified_data: Dict[int, str], supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    try:
        category_ids = []
        updated_category_names = []

        for word_category_id, new_category_name in modified_data.items():
            category_ids.append(word_category_id)
            new_category_name = new_category_name.strip()

            if len(new_category_name) == 0 or len(new_category_name) > 30:
                    raise HTTPException(status_code=400, detail=f"A category name cannot be empty and more than 30 characters long.")
            
            updated_category_names.append(new_category_name)

        await run_in_threadpool(lambda: supabase.rpc("update_word_categories", {
                "p_category_ids": category_ids,
                "p_category_names": updated_category_names
            }).execute())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# DELETE ---------------------------------------------------------------------------------------------------------------------------------------

@router.delete("/word-phrases")
async def del_word_phrases(delete_data: List[int], request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    try:
        await run_in_threadpool(lambda: supabase.table("word_bank").delete().in_("word_id", delete_data).execute())
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.delete("/categories")
async def del_word_categories(word_category_ids: List[int], request: Request, supabase=Depends(get_user_client)):
    user = request.session.get('user')
    
    if not user:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    try:
        await run_in_threadpool(lambda: supabase.table("word_category").delete().in_("word_category_id", word_category_ids).execute())

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))