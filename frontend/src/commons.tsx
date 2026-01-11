export const isAuth = "isAuth"
export const trueStr = "true"
export const falseStr = "false"
export const loadingStr = "Loading"
export const savingStr = "Saving"
export let userName = "userName"

export const initAuthInLocalStorage = () => {
    if (localStorage.getItem(isAuth) === null) {
        localStorage.setItem(isAuth, falseStr)
    }
}

export const setAuthInLocalStorage = (error: any) => {
    if (error.response?.status === 401) {
        localStorage.setItem(isAuth, falseStr)
    }
}

export interface Category {
    word_category_id: number
    word_category: string
}

export interface WordPhrase {
    word_id: number
    word_category_id: number
    word_phrase: string
}

export interface VocabularyWord {
    word_id: number
    word: string
    definition: string
    frequency_score: number
}

export interface MistakeAndHint {
    mistake: string
    hint: string
}

export interface GrammarMistakeGroup {
    mistake_type: "Grammar" | "Spelling" | "Punctuation"
    mistakes: MistakeAndHint[]
}

export interface GrammarCheckResponse {
    grammar_check: GrammarMistakeGroup[]
}