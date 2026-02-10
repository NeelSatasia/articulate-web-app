import { useEffect, useRef, useState } from "react"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { isAuth, loadingStr, trueStr, type PromptInfo } from "../commons"
import api from "../api"
import Loading from "./Loading"
import { Spinner } from "./ui/spinner"

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

    const [loadingResult, setLoadingResult] = useState<boolean>(false)

    const [similarityResults, setSimilarityResults] = useState<number[] | null>(null)

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
                } else if (panel === 2) {
                    setTimeLeft(60)
                } else {
                    resetWriting()
                }

                setPanel(prev => prev + 1)
            }
        }
    }, [timeLeft])


    const getNextPrompt = () => {
        if (similarityResults !== null) {
            setSimilarityResults(null)
        }

        if (currPromptIdx + 1 < prompts.length) {
            setCurrPromptIdx(prev => prev + 1)
        } else {
            setCurrPromptIdx(0)
        }
    }

    const startWriting = () => {
        if (!writing) {

            setWords100("")
            setWords50("")
            setWords25("")
            
            setWriting(true)
            setTimeLeft(180)
            setPanel(1)

            if (similarityResults) {
                setSimilarityResults(null)
            }

            timerID.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
        } else {
            resetWriting()
            setPanel(0)
        }
    }

    const resetWriting = () => {
        if (timerID.current) {
            clearInterval(timerID.current)
        }
        
        setWriting(false)
        setTimeLeft(180)
    }

    const checkSimilarity = async () => {
        if (words100.trim().length === 0 || words50.trim().length === 0 || words25.trim().length === 0) {
            return
        }

        try {
            setLoadingResult(true)

            if (localStorage.getItem(isAuth) === trueStr) {
                const jsonData: Record<string, string> = {
                    words_100: words100,
                    words_50: words50,
                    words_25: words25
                }
                const resp = await api.post("/ai/essence-writing-check", jsonData)
                
                localStorage.setItem(isAuth, trueStr)
                setSimilarityResults(resp.data[0])
                setPanel(0)
            }
        } catch (error) {
            console.error("Error checking results", error)
        } finally {
            setLoadingResult(false)
        }
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }


    return (
        <div className="flex flex-col gap-y-8 p-4">

            <div className="flex flex-col justify-center items-center gap-y-4">
                <Button className="w-fit mb-10" onClick={getNextPrompt} disabled={panel > 0}>Next Prompt</Button>
                <p>{prompts[currPromptIdx].prompt}</p>
                <Button key="start-writing-btn" className={`${writing ? "bg-red-500 hover:bg-red-400" : "bg-orange-500 hover:bg-orange-400"} w-fit mt-10`} onClick={startWriting}>
                    {writing ? "Cancel" : "Start"}
                </Button>
            </div>

            <div className="flex flex-col gap-y-2">
                {similarityResults === null ? <Label>Time Left: {panel === 1 ? timeLeft : 0} seconds</Label> : <Label><span className={`font-bold ${similarityResults[0] <= 0.30 ? "text-red-600" : similarityResults[0] <= 0.60 ? "text-orange-600" : "text-green-600"}`}>{(similarityResults[0] * 100).toFixed(2)}%</span> match with response 2 and 3</Label>}
                <Textarea placeholder="100 words or less" value={words100} onChange={(e) => {
                    if (e.target.value.trim().split(/\s+/).length <= 100) {
                        setWords100(e.target.value)
                    }
                }} disabled={panel !== 1} />
            </div>

            <div className="flex flex-col gap-y-2">
                {similarityResults === null ? <Label>Time Left: {panel === 2 ? timeLeft : 0} seconds</Label> : <Label><span className={`font-bold ${similarityResults[1] <= 0.30 ? "text-red-600" : similarityResults[0] <= 0.60 ? "text-orange-600" : "text-green-600"}`}>{(similarityResults[1] * 100).toFixed(2)}%</span> match with response 1 and 3</Label>}
                <Textarea placeholder="50 words or less" value={words50} onChange={(e) => {
                    if (e.target.value.trim().split(/\s+/).length <= 50) {
                        setWords50(e.target.value)
                    }
                }} disabled={panel !== 2} />
            </div>

            <div className="flex flex-col gap-y-2">
                {similarityResults === null ? <Label>Time Left: {panel === 3 ? timeLeft : 0} seconds</Label> : <Label><span className={`font-bold ${similarityResults[2] <= 0.30 ? "text-red-600" : similarityResults[0] <= 0.60 ? "text-orange-600" : "text-green-600"}`}>{(similarityResults[2] * 100).toFixed(2)}%</span> match with response 1 and 2</Label>}
                <Textarea placeholder="25 words or less" value={words25} onChange={(e) => {
                    if (e.target.value.trim().split(/\s+/).length <= 25) {
                        setWords25(e.target.value)
                    }
                }} disabled={panel !== 3} />
            </div>

            <div className="flex justify-center">
                {loadingResult ? <Spinner /> : 
                    similarityResults === null &&
                    <Button className="w-fit bg-emerald-600 hover:bg-emerald-500" onClick={checkSimilarity} disabled={panel !== 4}>Submit</Button>
                }
            </div>
        </div>
    )
}

export default EssenceWriting