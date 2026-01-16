from userclient import get_user_client
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.concurrency import run_in_threadpool
from models import VocabularyWordInfo
from typing import List

router = APIRouter(prefix="/vocabulary", tags=["Vocabulary"])

# GET ---------------------------------------------------------------------------------------------------------------------------------------

@router.get("")
async def user_vocabulary(supabase=Depends(get_user_client)):
    
    try:
        result = await run_in_threadpool(lambda: supabase.table("user_vocabulary").select("word_id, vocabulary_words(word, definition, word_level)").order("word_id").execute())

        if result:

            cleaned_data = []

            for item in result.data:
                cleaned_data.append({
                    "word_id": item["word_id"], 
                    "word": item["vocabulary_words"]["word"], 
                    "definition": item["vocabulary_words"]["definition"], 
                    "word_level": item["vocabulary_words"]["word_level"]
                })

            return cleaned_data
        
        return {
            "error": f"Failed to fetch vocabulary for user!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
@router.get("/dashboard")
async def user_dashboard(supabase=Depends(get_user_client)):

    try:
        
        #TODO: Retrieve at least 5 unique user's vocabulary words every 24 hours

        return []

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

# POST --------------------------------------------------------------------------------------------------------------------------------------

@router.post("")
async def add_vocabulary_word(word_info: VocabularyWordInfo, request: Request, supabase=Depends(get_user_client)):

    user = request.session.get('user')

    try:
        insert_data = {
            "user_id": user["user_id"],
            "word_id": word_info.word_id
        }

        result = await run_in_threadpool(lambda: supabase.table("user_vocabulary").insert(insert_data).execute())

        if result:
            return {
                "message": f"Successfully added word with id {word_info.word_id} to user's vocabulary!"
            }
        
        return {
            "error": f"Failed to add word with id {word_info.word_id} to user's vocabulary!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

# DELETE ------------------------------------------------------------------------------------------------------------------------------------

@router.delete("")
async def delete_vocabulary_word(word_ids: List[int], supabase=Depends(get_user_client)):

    try:
        result = await run_in_threadpool(lambda: supabase.table("user_vocabulary").delete().in_("word_id", word_ids).execute())

        if result:
            return {
                "message": f"Successfully removed selected words from user's vocabulary!"
            }
        
        return {
            "error": f"Failed to remove selected words from user's vocabulary!"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))