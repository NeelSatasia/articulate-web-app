import { Navigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type ChatMessage} from "../commons"
import Loading from "./Loading"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const messages = useRef<ChatMessage[]>([])
    const [userResponse, setUserResponse] = useState<string>("")
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false)
    const isPracticing = useRef<boolean>(false)
    const [remainingAttempts, setRemainingAttempts] = useState<number>(3)


    const generateModelResponse = async () => {
        try {
            setIsModelLoading(true)
            
            try {
                const resp = await api.post("/ai/generate", JSON.stringify(userResponse.trim()),
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

                    setRemainingAttempts(3 - attemptsTaken)
                }
            } catch (err: any) {
                console.error("Error generating model response", err)
            }
        } catch (err) {
            console.error("Error calling model", err)
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
        setUserResponse("")

        await generateModelResponse()
    }

    const practiceNextWord = async () => {
        messages.current = []
        isPracticing.current = true
        setUserResponse("")
        setRemainingAttempts(3)

        await api.put("/auth/target-word-reset")
        await generateModelResponse()
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

            <Button onClick={practiceNextWord} className="w-fit">Next Word</Button>

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

                {isModelLoading && <Spinner />}
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

export default Dashboard