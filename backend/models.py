from pydantic import BaseModel
from typing import Literal

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

class GrammarMistakes(BaseModel):
    mistake_type: Literal["grammar", "spelling", "punctuation", "style"]
    mistake: str
    hint: str

class GrammarReview(BaseModel):
    mistakes: list[GrammarMistakes]