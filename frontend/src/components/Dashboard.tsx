import { Navigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type WordPhrase, type ChatMessage} from "../commons"
import Loading from "./Loading"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const messages = useRef<ChatMessage[]>([])
    const [words, setWords] = useState<WordPhrase[]>([])
    const [userResponse, setUserResponse] = useState<string>("")
    const [isModelLoading, setIsModelLoading] = useState<boolean>(false)


    const generateModelResponse = async () => {
        try {
            setIsModelLoading(true)

            const last = messages.current[messages.current.length - 1]
            let inputContent = ""

            if (last && last.role === "user") {
                inputContent = last.content
            } else {
                if (words.length === 0) {
                    inputContent = ""
                } else {
                    const idx = Math.floor(Math.random() * words.length)
                    inputContent = (words[idx] as any).word_phrase || ""
                    messages.current.push({ role: "user", content: `Target vocabulary word: ${inputContent}` })
                }
            }

            const resp = await api.post("/ai/generate", messages.current)

            const assistantContent = resp.data.output || ""

            if (assistantContent) {
                messages.current.push({ role: "assistant", content: assistantContent })
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
        await generateModelResponse()
    }

    useEffect(() => {
        const getAuth = async () => {
            try {
                const req = await api.get("/wordbank")
                setWords(req.data)
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
        <div className="relative flex w-full flex-col gap-6 px-4 py-6 text-left sm:px-6">

            <Button onClick={practiceNextWord} className="w-fit">Next Word</Button>

            <div className="flex flex-col gap-3 mt-4 h-[70vh] w-full overflow-auto rounded-xl p-2">
                {messages.current.map((m, i) => (
                    <div key={i} className="w-full">
                        <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] p-2 rounded-xl ${m.role === "user" ? "bg-sky-300 text-right" : "bg-orange-300 text-left"}`}>
                                <span>{m.content}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {isModelLoading && <Spinner />}
            </div>

            <Input
                placeholder="Type your response and press Enter"
                value={userResponse}
                onChange={(e: any) => setUserResponse(e.target.value)}
                onKeyDown={async (e: any) => {
                    if (e.key === "Enter" && userResponse.trim() !== "") {
                        await addNewUserResponse()
                    }
                }}
            />
        </div>
    )
}

export default Dashboard