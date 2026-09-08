from pydantic import BaseModel
from typing import List

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

class TargetWord(BaseModel):
    word_id: int

class UserRequest(BaseModel):
    user_response: str

class Evaluation(BaseModel):
    correct: bool
    feedback: str | None
    example: str | None
    answer_explanation: str | None

class Situation(BaseModel):
    situation: str
    follow_up_question: str