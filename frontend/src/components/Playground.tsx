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

                const content: ChatMessage[] = resp.data

                if (content) {

                    for (const msg of content) {
                        messages.current.push(msg)

                        if (msg.content.toLowerCase() === "correct") {
                            isPracticing.current = false
                        }
                    }
                    
                    let attemptsTaken = 0

                    for (let i = 2; i < messages.current.length; i++) {
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

    const practiceWord = async () => {
        messages.current = []
        isPracticing.current = true
        setUserResponse("")
        setRemainingAttempts(3)

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
        setUserResponse("")
        setRemainingAttempts(3)
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
        <div className="flex flex-col w-full gap-6 px-4 items-center sm:px-6">
            
            <div className="flex gap-x-4">
                <Button onClick={practiceWord} className="w-fit" disabled={!isPracticing}>Practice Word</Button>
                <Button onClick={nextWord} className="w-fit">Next Word</Button>
            </div>

            {!isPracticing.current && words.length > 0 && (
                <div className="flex gap-2">
                    <span className="text-sm text-neutral-500">Word: {words[currentIndex].word_phrase}</span>
                </div>
            )}

            <div className="flex flex-col gap-3 h-[70vh] w-full overflow-auto rounded-xl p-2">
                {messages.current.map((m, i) => (
                    <div key={i} className="w-full">
                        <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] p-2 rounded-xl ${m.role === "user" ? "bg-cyan-600 text-secondary" : m.content.toLowerCase() === "correct" ? "bg-green-500 text-white" : "bg-secondary text-neutral-700"}`}>
                                <span>{m.content}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {isModelLoading && <div className="w-full flex justify-center items-center"><Spinner/></div>}
            </div>

            <span className="text-sm text-neutral-500">Remaining Attempts: {remainingAttempts}</span>

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
            />
        </div>
    )
}

export default Playground