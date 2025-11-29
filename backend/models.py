from pydantic import BaseModel

class User(BaseModel):
    user_name: str
    user_email: str

class WordCategory(BaseModel):
    user_id: int
    word_category: str

class WordPhrase(BaseModel):
    user_id: int
    word_category_id: int
    word_phrase: str