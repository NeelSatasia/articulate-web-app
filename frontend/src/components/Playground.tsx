import { Navigate, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type ChatMessage, type WordPhrase} from "../commons"
import Loading from "./Loading"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"


const Playground = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const messages = useRef<ChatMessage[]>([])
    const [userResponse, setUserResponse] = useState<string>("")
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false)
    const isPracticing = useRef<boolean>(false)
    const [remainingAttempts, setRemainingAttempts] = useState<number>(3)
    const [currentIndex, setCurrentIndex] = useState<number>(0)

    const location = useLocation()
    
    const words: WordPhrase[] = location.state?.words

    const generateModelResponse = async () => {
        try {
            setIsModelLoading(true)
            
            try {
                const resp = await api.post("/ai/generate-word-context", {
                    user_response: userResponse.trim(),
                    word_id: words[currentIndex].word_id
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                })

                const content: string = resp.data

                if (content) {

                    messages.current.push({
                        role: "assistant",
                        content: content
                    })

                    if (content.toLowerCase() === "correct") {
                        isPracticing.current = false
                    }
                    
                    let attemptsTaken = 0

                    for (let i = 0; i < messages.current.length; i++) {
                        if (messages.current[i].role === "user") {
                            attemptsTaken++
                        }
                    }

                    if (attemptsTaken >= 3) {
                        isPracticing.current = false
                    }

                    setRemainingAttempts(3 - attemptsTaken)
                }
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
        if (userResponse.trim() === "") {
            return
        }

        const newMsg: ChatMessage = {
            role: "user",
            content: userResponse.trim()
        }

        messages.current.push(newMsg)

        await generateModelResponse()
    }

    const resetUserResponsesAttempts = async () => {
        messages.current = []
        setUserResponse("")
        setRemainingAttempts(3)
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

    const nextWord = async () => {
        isPracticing.current = false

        const next = currentIndex + 1
        if (!words || next >= words.length) {
            return
        }

        setCurrentIndex(next)
        resetUserResponsesAttempts()
    }

    const previousWord = async () => {
        isPracticing.current = false

        const prev = currentIndex - 1
        if (!words || prev < 0) {
            return
        }

        setCurrentIndex(prev)
        resetUserResponsesAttempts()
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
                        Attempts left: {remainingAttempts}
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
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ring-1 ${m.role === "user" ? "bg-primary text-primary-foreground ring-border" : m.content.toLowerCase() === "correct" ? "bg-foreground text-background ring-border" : "bg-card text-foreground ring-border"}`}>
                                    <span>{m.content}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isModelLoading && <div className="w-full flex justify-center items-center py-4"><Spinner/></div>}
                </div>

                <div className="shrink-0 rounded-2xl border border-border bg-background p-4 shadow-sm sm:flex sm:items-center">
                    <Input
                        placeholder="Type your response and press Enter"
                        value={userResponse}
                        onChange={(e: any) => setUserResponse(e.target.value)}
                        onKeyDown={async (e: any) => {
                            if (e.key === "Enter" && userResponse.trim() !== "") {
                                await addNewUserResponse()
                            }
                        }}
                        disabled={isModelLoading || !isPracticing.current}
                        className="h-12 rounded-full border-border bg-background px-5 text-base shadow-inner shadow-black/5 transition placeholder:text-muted-foreground focus-visible:ring-ring/40"
                    />
                </div>
            </div>
        </div>
    )
}

export default Playground