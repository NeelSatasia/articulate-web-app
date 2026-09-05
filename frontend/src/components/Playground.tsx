import { Navigate, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type ChatMessage, type Evaluation, type Situation, type WordPhrase} from "../commons"
import Loading from "./Loading"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"

type SpeechRecognitionResultLike = {
    isFinal: boolean
    0: {
        transcript: string
    }
}

type SpeechRecognitionEventLike = {
    results: ArrayLike<SpeechRecognitionResultLike>
}

type SpeechRecognitionLike = {
    lang: string
    continuous: boolean
    interimResults: boolean
    onresult: ((event: SpeechRecognitionEventLike) => void) | null
    onerror: (() => void) | null
    onend: (() => void) | null
    start: () => void
    stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike


const Playground = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const [userResponse, setUserResponse] = useState<string>("")
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false)
    const [speechSupported, setSpeechSupported] = useState<boolean>(true)
    const [isListening, setIsListening] = useState<boolean>(false)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const messages = useRef<ChatMessage[]>([])
    const remainingAttempts = useRef<number>(3)
    const isPracticing = useRef<boolean>(false)
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
    const baseResponseRef = useRef<string>("")

    const location = useLocation()
    
    const words: WordPhrase[] = location.state?.words

    const capitalizeFirstLetterOfFirstWord = (value: string) => {
        return value.replace(/^(\s*)(\S)/, (_, leadingSpace: string, firstChar: string) => {
            return `${leadingSpace}${firstChar.toUpperCase()}`
        })
    }

    const isSituation = (value: unknown): value is Situation => {
        return typeof value === "object" && value !== null && "situation" in value && typeof (value as Situation).situation === "string"
    }

    const isEvaluation = (value: unknown): value is Evaluation => {
        return typeof value === "object" && value !== null && "correct" in value && typeof (value as Evaluation).correct === "boolean"
    }

    const generateModelResponse = async () => {
        try {
            setIsModelLoading(true)
            
            try {

                if (messages.current.length == 0) {
                    const resp = await api.post("/ai/generate-situation", {
                        word_id: words[currentIndex].word_id}, 
                        {
                        headers: {
                            "Content-Type": "application/json"
                        },
                    })

                    const content: Situation = resp.data

                    messages.current.push({
                        role: "assistant",
                        content
                    })
                } 
                
                else {
                    const resp = await api.post("/ai/validate-user-response", {
                        user_response: userResponse.trim()
                    },
                    {
                        headers: {
                            "Content-Type": "application/json"
                        },
                    })

                    const content: Evaluation = resp.data

                    messages.current.push({
                        role: "assistant",
                        content
                    })

                    remainingAttempts.current -= 1

                    if (content.correct || remainingAttempts.current <= 0) {
                        isPracticing.current = false
                    }
                }

                setUserResponse("")
            } catch (err: any) {
                console.error("Error generating model response", err)
            }
        } catch (err) {
            console.error("Error calling AI model", err)
        } finally {
            setIsModelLoading(false)
        }
    }

    const addNewUserResponse = async () => {
        const normalizedUserResponse = capitalizeFirstLetterOfFirstWord(userResponse)

        if (normalizedUserResponse.trim() === "") {
            return
        }

        const newMsg: ChatMessage = {
            role: "user",
            content: normalizedUserResponse.trim()
        }

        messages.current.push(newMsg)

        await generateModelResponse()
    }

    const renderAssistantMessage = (messageContent: Situation | Evaluation) => {
        if (isSituation(messageContent)) {
            return (
                <div className="space-y-1">
                    {messageContent.situation && (
                        <p><span className="font-semibold">Situation:</span> {messageContent.situation}</p>
                    )}
                    {messageContent.follow_up_question && (
                        <p><span className="font-semibold">Follow-up Question:</span> {messageContent.follow_up_question}</p>
                    )}
                </div>
            )
        }

        if (isEvaluation(messageContent)) {
            if (messageContent.correct) {
                return (
                    <div className="space-y-1">
                        <p className="font-semibold text-green-600">Correct</p>
                    </div>
                )
            }

            return (
                <div className="space-y-1">
                    <p className="font-semibold text-red-600">Incorrect</p>
                    {messageContent.feedback && (
                        <p><span className="font-semibold">Feedback:</span> {messageContent.feedback}</p>
                    )}
                    {messageContent.example && (
                        <p><span className="font-semibold">Example:</span> {messageContent.example}</p>
                    )}
                    {messageContent.explanation && (
                        <p><span className="font-semibold">Explanation:</span> {messageContent.explanation}</p>
                    )}
                </div>
            )
        }

        return null
    }

    const resetUserResponsesAttempts = () => {
        messages.current = []
        remainingAttempts.current = 3
        setUserResponse("")
    }

    const practiceWord = async () => {
        isPracticing.current = true
        resetUserResponsesAttempts()

        try {
            await api.put("/auth/target-word-reset")
        } catch (err) {
            console.error("Error resetting target word info in the cookie session", err)
        }

        if (words && words.length > 0) {
            await generateModelResponse()
        } else {
            console.error("No words list provided to start practice")
        }
    }

    const nextWord = () => {
        isPracticing.current = false

        const next = currentIndex + 1
        if (!words || next >= words.length) {
            return
        }

        setCurrentIndex(next)
        resetUserResponsesAttempts()
    }

    const previousWord = () => {
        isPracticing.current = false

        const prev = currentIndex - 1
        if (!words || prev < 0) {
            return
        }

        setCurrentIndex(prev)
        resetUserResponsesAttempts()
    }

    const toggleSpeechToText = () => {
        const recognition = recognitionRef.current

        if (!recognition) {
            return
        }

        if (isListening) {
            recognition.stop()
            return
        }

        baseResponseRef.current = userResponse.trim()
        recognition.start()
        setIsListening(true)
    }

    useEffect(() => {
        const getAuth = async () => {
            try {
                await api.get("/auth/check")
                localStorage.setItem(isAuth, trueStr)
            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error checking authentication", error)
            } finally {
                setLoading(false)
            }
        }

        getAuth()
    }, [])

    useEffect(() => {
        const speechWindow = window as Window & {
            SpeechRecognition?: SpeechRecognitionConstructor
            webkitSpeechRecognition?: SpeechRecognitionConstructor
        }

        const RecognitionClass = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition

        if (!RecognitionClass) {
            setSpeechSupported(false)
            return
        }

        const recognition = new RecognitionClass()
        recognition.lang = "en-US"
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0].transcript)
                .join(" ")
                .trim()

            if (!transcript) {
                return
            }

            const nextResponse = [baseResponseRef.current, transcript]
                .filter(Boolean)
                .join(" ")
                .trim()

            setUserResponse(capitalizeFirstLetterOfFirstWord(nextResponse))
        }

        recognition.onerror = () => {
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            recognition.stop()
            recognitionRef.current = null
        }
    }, [])

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    return (
        <div className="h-screen h-full min-h-0 w-full overflow-hidden p-3">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-3xl border border-border p-4">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background px-5 py-4">
                    <div>
                        {words.length > 0 && (
                            <p className="text-xl font-semibold text-foreground">{words[currentIndex].word_phrase}</p>
                        )}
                    </div>

                    <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                        Attempts left: {remainingAttempts.current}
                    </span>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                    <Button onClick={previousWord} className="w-fit rounded-full border border-border bg-background px-5 text-foreground shadow-none transition hover:bg-secondary" disabled={currentIndex === 0}>Back</Button>
                    <Button onClick={practiceWord} className="w-fit rounded-full bg-primary px-5 text-primary-foreground shadow-none transition hover:opacity-90" disabled={!isPracticing}>Practice</Button>
                    <Button onClick={nextWord} className="w-fit rounded-full border border-border bg-background px-5 text-foreground shadow-none transition hover:bg-secondary" disabled={currentIndex >= words.length - 1}>Next</Button>
                </div>


                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-2xl bg-muted/40 p-4 sm:p-5">
                    {messages.current.map((m, i) => (
                        <div key={i} className="w-full">
                            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ring-1 ${m.role === "user" ? "bg-primary text-primary-foreground ring-border" : "bg-card text-foreground ring-border"}`}>
                                    {typeof m.content === "string" ? <span>{m.content}</span> : renderAssistantMessage(m.content)}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isModelLoading && <div className="w-full flex justify-center items-center py-4"><Spinner/></div>}
                </div>

                <div className="shrink-0 rounded-2xl bg-background p-4 sm:flex sm:items-center sm:gap-3">
                    <Input
                        placeholder="Type your response and press Enter"
                        value={userResponse}
                        onChange={(e: any) => setUserResponse(capitalizeFirstLetterOfFirstWord(e.target.value))}
                        onKeyDown={async (e: any) => {
                            if (e.key === "Enter" && userResponse.trim() !== "") {
                                await addNewUserResponse()
                            }
                        }}
                        disabled={isModelLoading || !isPracticing.current}
                        className="h-12 rounded-full border-border bg-background px-5 text-base shadow-inner shadow-black/5 transition placeholder:text-muted-foreground focus-visible:ring-ring/40 sm:flex-1"
                    />

                    <Button
                        type="button"
                        variant={isListening ? "secondary" : "outline"}
                        onClick={toggleSpeechToText}
                        disabled={!speechSupported || isModelLoading || !isPracticing.current}
                        className="mt-3 w-full rounded-full sm:mt-0 sm:w-fit"
                    >
                        {isListening ? "Stop Mic" : "Start Mic"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Playground