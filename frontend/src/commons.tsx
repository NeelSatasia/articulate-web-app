import { Button } from "./components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./components/ui/alert-dialog"

export const isAuth = "isAuth"
export const trueStr = "true"
export const falseStr = "false"
export const loadingStr = "Loading"
export const savingStr = "Saving"
export let userName = "userName"
export const backendServiceURL = import.meta.env.VITE_BACKEND_URL

export const initAuthInLocalStorage = () => {
    if (localStorage.getItem(isAuth) === null) {
        localStorage.setItem(isAuth, falseStr)
    }
}

export const getErrorDetail = (error: any) => {
    const detail = error?.response?.data?.detail

    if (typeof detail === "string") {
        return detail.replace(/^\d{3}:\s*/, "")
    }

    return "An unexpected error occurred."
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

export interface Situation {
    situation: string
}

export interface Evaluation {
    correct: boolean
    feedback?: string
    example?: string
    answer_explanation?: string
}

export interface ChatMessage {
    role: "system" | "user" | "assistant"
    content: string | Situation | Evaluation
}

export interface ErrorAlertDialogProps {
    open: boolean
    errorDetail: string
    onOpenChange: (open: boolean) => void
    title?: string
}

export interface ErrorAlert {
    title: string
    detail: string
}

export const AuthError : ErrorAlert = {
    title: "Authentication Error",
    detail: "Your session has expired. Please log in again."
}

export const RateLimitError : ErrorAlert = {
    title: "Rate Limit Exceeded",
    detail: "You are making requests too quickly. Please wait a moment and try again."
}

export const ErrorAlertDialog = ({
    open,
    errorDetail,
    onOpenChange,
    title = "Error",
}: ErrorAlertDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{errorDetail}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction asChild>
                        <Button size="sm">Okay</Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export const WhiteLabelBlock = ({value} : {value: string}) => {
    return <span className="font-semibold bg-white px-1 rounded-md text-secondary w-fit">{value}</span>
}