import { useEffect, useRef, useState } from "react"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { isAuth, loadingStr, trueStr, type PromptInfo } from "../commons"
import api from "../api"
import Loading from "./Loading"

const EssenceWriting = () => {

    const [words100, setWords100] = useState<string>("")
    const [words50, setWords50] = useState<string>("")
    const [words25, setWords25] = useState<string>("")

    const [prompts, setPrompts] = useState<PromptInfo[]>([])
    const [currPromptIdx, setCurrPromptIdx] = useState<number>(0)

    const [writing, setWriting] = useState<boolean>(false)

    const [loading, setLoading] = useState<boolean>(true)

    const [panel, setPanel] = useState<number>(0)
    const [timeLeft, setTimeLeft] = useState<number>(180)

    const timerID = useRef<number | null>(null)


    useEffect(() => {
        const getPrompts = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/prompts")
                    
                    localStorage.setItem(isAuth, trueStr)
                    setPrompts(resp.data)
                }
            } catch (error) {
                console.error("Error fetching prompts", error)
            } finally {
                setLoading(false)
            }
        }

        getPrompts()
    }, [])

    useEffect(() => {
        if (writing) {
            if (timeLeft === 0) {
                if (panel === 1) {
                    setTimeLeft(120)
                    setPanel(2)
                } else if (panel === 2) {
                    setTimeLeft(60)
                    setPanel(3)
                } else {
                    resetWriting()
                    return
                }
            }
        }
    }, [timeLeft])


    const getNextPrompt = () => {
        if (currPromptIdx + 1 < prompts.length) {
            setCurrPromptIdx(prev => prev + 1)
        } else {
            setCurrPromptIdx(0)
        }
    }

    const startWriting = () => {
        if (!writing) {
            
            setWriting(true)
            setTimeLeft(180)
            setPanel(1)

            timerID.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else {
            resetWriting()
        }
    }

    const resetWriting = () => {
        if (timerID.current) {
            clearInterval(timerID.current)
        }
        setPanel(0)
        setWriting(false)
        setTimeLeft(180)
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }


    return (
        <div className="flex flex-col gap-y-8 p-4">

            <div className="flex flex-col justify-center items-center gap-y-4">
                <Button className="w-fit" onClick={getNextPrompt} disabled={panel > 0}>Next Prompt</Button>
                <p>{prompts[currPromptIdx].prompt}</p>
                <Button key="start-writing-btn" className={`${writing ? "bg-red-500 hover:bg-red-400" : "bg-primary"} w-fit`} onClick={startWriting}>
                    {writing ? "Cancel" : "Start"}
                </Button>
            </div>

            <div className="flex flex-col gap-y-2">
                <Label>Time Left: {panel === 1 ? timeLeft : 0}</Label>
                <Textarea placeholder="100 words or less" value={words100} onChange={(e) => {
                    if (e.target.value.trim().split(/\s+/).length <= 100) {
                        setWords100(e.target.value)
                    }
                }} disabled={panel !== 1} />
            </div>

            <div className="flex flex-col gap-y-2">
                <Label>Time Left: {panel === 2 ? timeLeft : 0}</Label>
                <Textarea placeholder="50 words or less" value={words50} onChange={(e) => {
                    if (e.target.value.trim().split(/\s+/).length <= 50) {
                        setWords50(e.target.value)
                    }
                }} disabled={panel !== 2} />
            </div>

            <div className="flex flex-col gap-y-2">
                <Label>Time Left: {panel === 3 ? timeLeft : 0}</Label>
                <Textarea placeholder="25 words or less" value={words25} onChange={(e) => {
                    if (e.target.value.trim().split(/\s+/).length <= 25) {
                        setWords25(e.target.value)
                    }
                }} disabled={panel !== 3} />
            </div>

            <div className="flex justify-center">
                <Button className="w-fit bg-emerald-600 hover:bg-emerald-500">Submit</Button>
            </div>
        </div>
    )
}

export default EssenceWriting