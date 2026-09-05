export const isAuth = "isAuth"
export const trueStr = "true"
export const falseStr = "false"
export const loadingStr = "Loading"
export const savingStr = "Saving"
export let userName = "userName"
export const backendServiceURL = "http://localhost:8000"

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
    success_attempts: number
    failed_attempts: number
    avg_success_attempts: number
    last_attempted_at: string | null
}

export interface VocabularyWord {
    word_id: number
    word: string
    definition: string
    example: string
    word_level: number
}

export interface ChatMessage {
    role: "system" | "user" | "assistant"
    content: string | Situation | Evaluation
}

export interface Situation {
    situation: string
    follow_up_question: string
}

export interface Evaluation {
    correct: boolean
    feedback?: string
    example?: string
    explanation?: string
}