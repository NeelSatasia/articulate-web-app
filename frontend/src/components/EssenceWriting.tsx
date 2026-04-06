import { useEffect, useState } from "react"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { isAuth, loadingStr, setAuthInLocalStorage, trueStr, type PromptInfo } from "../commons"
import api from "../api"
import Loading from "./Loading"
import { Spinner } from "./ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

const EssenceWriting = () => {

    const [words100, setWords100] = useState<string>("")
    const [words50, setWords50] = useState<string>("")
    const [words25, setWords25] = useState<string>("")

    const [prompts, setPrompts] = useState<PromptInfo[]>([])
    const [currPromptIdx, setCurrPromptIdx] = useState<number>(0)

    const [loading, setLoading] = useState<boolean>(true)

    const [loadingResult, setLoadingResult] = useState<boolean>(false)

    const [similarityResults, setSimilarityResults] = useState<number[] | null>(null)

    const wordCount = (value: string) => {
        const trimmed = value.trim()
        if (!trimmed) {
            return 0
        }
        return trimmed.split(/\s+/).length
    }

    const getResultTone = (score: number) => {
        if (score <= 0.30) {
            return {
                color: "text-red-600",
                label: "Needs alignment",
                note: "Your summaries are diverging too much in meaning.",
            }
        }

        if (score <= 0.60) {
            return {
                color: "text-orange-600",
                label: "Partially aligned",
                note: "Core idea is present, but focus can be tighter.",
            }
        }

        return {
            color: "text-green-600",
            label: "Strong alignment",
            note: "Great compression while preserving the core meaning.",
        }
    }

    const resultMeta = [
        {
            key: "r100-50",
            title: "100 words vs 50 words",
            description: "How well your first compression preserves meaning.",
        },
        {
            key: "r100-25",
            title: "100 words vs 25 words",
            description: "How much of the original essence survives deep compression.",
        },
        {
            key: "r50-25",
            title: "50 words vs 25 words",
            description: "How consistent your final reduction remains.",
        },
    ]

    useEffect(() => {
        const getPrompts = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/prompts")
                    
                    localStorage.setItem(isAuth, trueStr)
                    setPrompts(resp.data)
                }
            } catch (error) {
                setAuthInLocalStorage(error)
                console.error("Error fetching prompts", error)
            } finally {
                setLoading(false)
            }
        }

        getPrompts()
    }, [])


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
                setSimilarityResults(resp.data)
            }
        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Error checking results", error)
        } finally {
            setLoadingResult(false)
        }
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }


    return (
        <div className="flex w-full flex-col gap-6 p-4 pb-30">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Essence Writing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Write one idea in 3 passes: 100 words, then 50, then 25. The topic prompt below is optional.
                    </p>

                    <div className="rounded-md border bg-muted/40 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <Label className="text-sm font-medium">Optional Topic Prompt</Label>
                            <Button className="w-fit"  onClick={getNextPrompt} disabled={prompts.length === 0}>
                                Next Prompt
                            </Button>
                        </div>
                        <p className="text-sm">
                            {prompts.length > 0
                                ? prompts[currPromptIdx].prompt
                                : "No prompt available. You can still write about any topic you want."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your 3 Responses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="essence-100">Response 1 (100 words max)</Label>
                            <span className={`text-xs ${wordCount(words100) > 100 ? "text-red-600" : "text-muted-foreground"}`}>
                                {wordCount(words100)}/100
                            </span>
                        </div>
                        <Textarea
                            id="essence-100"
                            placeholder="Write your full idea (up to 100 words)..."
                            value={words100}
                            onChange={(e) => {
                                if (wordCount(e.target.value) <= 100) {
                                    setWords100(e.target.value)
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="essence-50">Response 2 (50 words max)</Label>
                            <span className={`text-xs ${wordCount(words50) > 50 ? "text-red-600" : "text-muted-foreground"}`}>
                                {wordCount(words50)}/50
                            </span>
                        </div>
                        <Textarea
                            id="essence-50"
                            placeholder="Compress the same idea into 50 words..."
                            value={words50}
                            onChange={(e) => {
                                if (wordCount(e.target.value) <= 50) {
                                    setWords50(e.target.value)
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="essence-25">Response 3 (25 words max)</Label>
                            <span className={`text-xs ${wordCount(words25) > 25 ? "text-red-600" : "text-muted-foreground"}`}>
                                {wordCount(words25)}/25
                            </span>
                        </div>
                        <Textarea
                            id="essence-25"
                            placeholder="Compress again into 25 words..."
                            value={words25}
                            onChange={(e) => {
                                if (wordCount(e.target.value) <= 25) {
                                    setWords25(e.target.value)
                                }
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {loadingResult ? (
                            <Spinner />
                        ) : (
                            <Button className="w-fit bg-emerald-600 hover:bg-emerald-500" onClick={checkSimilarity}>
                                Check Results
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground">All three responses are required.</p>
                    </div>
                </CardContent>
            </Card>

            {similarityResults !== null && (
                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-3">
                            {resultMeta.map((meta, index) => {
                                const score = similarityResults[index]
                                const tone = getResultTone(score)

                                return (
                                    <div key={meta.key} className="rounded-md border bg-muted/30 p-3">
                                        <p className="text-sm font-semibold">{meta.title}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
                                        <p className={`mt-3 text-2xl font-bold ${tone.color}`}>
                                            {(score * 100).toFixed(2)}%
                                        </p>
                                        <p className={`text-sm font-medium ${tone.color}`}>{tone.label}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{tone.note}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default EssenceWriting