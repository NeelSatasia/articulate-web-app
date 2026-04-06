from pydantic import BaseModel, Field
from typing import Literal, List, Optional

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
    example: str
    cefr_level: str

class WordBatchResponse(BaseModel):
    words: List[WordInfo]

class VocabularyBatchRequest(BaseModel):
    words: List[str]

class PromptInfo(BaseModel):
    prompt_id: int
    prompt: str

class EssenceWritingReponse(BaseModel):
    words_100: str
    words_50: str
    words_25: str

class VerifyUsageRequest(BaseModel):
    text: str
    words: List[str]

class WordUsageCheck(BaseModel):
    word: str
    is_correct: bool = Field(description="True if the word is used correctly in context with decent grammar.")
    feedback: str = Field(description="If correctly used, return exactly 'yes'. If incorrect, provide a brief explanation of how to best use it in this context, or exactly 'no'.")

class UsageVerificationResult(BaseModel):
    results: List[WordUsageCheck]

class SentenceSimilarityRequest(BaseModel):
    text: str

class SentenceVocabularySuggestion(BaseModel):
    sentence_index: int
    sentence: str
    highlight: bool
    suggested_word: Optional[str] = None
    suggested_definition: Optional[str] = None
    similarity: Optional[float] = None
    highlight_rank: Optional[int] = None

class SentenceSimilarityResponse(BaseModel):
    text: str
    suggestions: List[SentenceVocabularySuggestion]