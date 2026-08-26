from pydantic import BaseModel
from typing import List
import prompts

class User(BaseModel):
    user_name: str
    user_email: str

class WordCategory(BaseModel):
    word_category_id: int
    word_category: str

class WordPhrase(BaseModel):
    word_category_id: int
    word_phrase: str

class VocabularyWordInfo(BaseModel):
    word_id: int

class WordInfo(BaseModel):
    word: str
    definition: str
    example: str
    cefr_level: str

class WordBatchResponse(BaseModel):
    words: List[WordInfo]

class VocabularyBatchRequest(BaseModel):
    words: List[str]

class AIMessage(BaseModel):
    role: str
    content: str