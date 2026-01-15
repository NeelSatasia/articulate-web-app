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

class MistakeAndHint(BaseModel):
    mistake: str
    hint: str

class GrammarMistake(BaseModel):
    mistake_type: Literal["Grammar", "Spelling", "Punctuation"]
    mistake: MistakeAndHint

class GrammarReview(BaseModel):
    mistakes: list[GrammarMistake]

class WordInfo(BaseModel):
    word: str
    definition: str
    cefr_level: str