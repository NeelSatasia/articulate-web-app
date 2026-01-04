from pydantic import BaseModel

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