import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api"
import {AuthError, ErrorAlertDialog, falseStr, getErrorDetail, isAuth, loadingStr, RateLimitError, trueStr, type ErrorAlert, type WordPhrase} from "../commons"
import Loading from "./Loading"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card"

const Dashboard = () => {

    const navigate = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)
    const [words, setWords] = useState<WordPhrase[]>([])
    const [error, setError] = useState<ErrorAlert>({title: "", detail: ""})

    const SUCCESS_ATTEMPTS_FACTOR = 3

    const NEEDS_REVIEW = "needs-review"
    const MAKING_PROGRESS = "making-progress"
    const MASTERED = "mastered"
    const NOT_ATTEMPTED_YET = "not-attempted-yet"

    useEffect(() => {
        const getWords = async () => {
            try {
                const resp = await api.get("/wordbank")
                localStorage.setItem(isAuth, trueStr)
                setWords(resp.data)
            } catch (err: any) {
                const statusCode = err?.response?.status
                console.log(statusCode)

                if (statusCode === 401) {
                    localStorage.setItem(isAuth, falseStr)
                    setError(AuthError)
                } 
                else if (statusCode === 429) {
                    setError(RateLimitError)
                }
                else {
                    setError({title: "Error Fetching Word Bank", detail: getErrorDetail(err)})
                }
            } finally {
                setLoading(false)
            }
        }

        getWords()
    }, [])

    const categories = (() => {
        const rows: { id: string; title: string; color: string; words: WordPhrase[] }[] = [
            { id: NEEDS_REVIEW, title: "Needs review", color: "text-red-400", words: [] },
            { id: MAKING_PROGRESS, title: "Making progress", color: "text-orange-400", words: [] },
            { id: MASTERED, title: "Mastered", color: "text-green-400", words: [] },
            { id: NOT_ATTEMPTED_YET, title: "Not attempted yet", color: "text-gray-400", words: [] }
        ]

        for (const word of words) {
            if (word.last_attempted_at === null) {
                rows[3].words.push(word)
                continue
            }

            const avg = word.avg_success_attempts
            const successAttempts = word.success_attempts
            const failedAttempts = word.failed_attempts

            if (avg > 2.0 || successAttempts * SUCCESS_ATTEMPTS_FACTOR <= failedAttempts) {
                rows[0].words.push(word)
            }

            else if (avg <= 1.1 && successAttempts >= 20 && successAttempts * SUCCESS_ATTEMPTS_FACTOR > failedAttempts) {
                rows[2].words.push(word)
            }

            else {
                rows[1].words.push(word)
            }
        }

        const sortByLastAttemptAsc = (arr: WordPhrase[]) => arr.sort((a, b) => {
            const da = a.last_attempted_at ? new Date(a.last_attempted_at).getTime() : 0
            const db = b.last_attempted_at ? new Date(b.last_attempted_at).getTime() : 0
            return da - db
        })

        rows[0].words = sortByLastAttemptAsc(rows[0].words)
        rows[1].words = sortByLastAttemptAsc(rows[1].words)
        rows[2].words = sortByLastAttemptAsc(rows[2].words)

        return rows
    })()

    const goToPlayground = (category: string, wordsForCategory: WordPhrase[]) => {
        navigate('/playground', { state: { category, words: wordsForCategory } })
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    return (
        <div className="w-full p-4 sm:p-6">
            <ErrorAlertDialog
                open={error.detail !== ""}
                errorDetail={error.detail}
                onOpenChange={(open) => {
                    if (!open) {
                        setError({ title: "", detail: "" })
                    }
                }}
                title={error.title}
            />

            <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

            <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-4">
                {categories.map((c) => (
                    <AccordionItem key={c.id} value={c.id}>
                        <AccordionTrigger className={`text-xl font-semibold ${c.color}`}>{c.title} ({c.words.length})</AccordionTrigger>
                        <AccordionContent>
                            {c.words.length > 0 &&
                            <>
                                <div className="mb-3">
                                    <Button onClick={() => goToPlayground(c.id, c.words)}>Practice</Button>
                                </div>
                                <div className="flex flex-row flex-wrap gap-2">
                                    {c.words.map(w => (
                                        <HoverCard openDelay={0} closeDelay={0}>
                                            <HoverCardTrigger className={`bg-secondary px-2 py-1 rounded-md text-sm ${c.id !== NOT_ATTEMPTED_YET && "cursor-pointer"}`}>
                                                {w.word_phrase}
                                            </HoverCardTrigger>
                                            {c.id !== NOT_ATTEMPTED_YET &&
                                                <HoverCardContent>
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <span className="text-green-300">Success Attempts: {w.success_attempts}</span>
                                                        <span className="text-red-300">Failed Attempts: {w.failed_attempts}</span>
                                                        <span className="text-gray-300">Last Attempted At: {w.last_attempted_at ? new Date(w.last_attempted_at).toLocaleDateString() : "Not yet attempted"}</span>
                                                    </div>
                                                </HoverCardContent>
                                            }
                                        </HoverCard>
                                    ))}
                                </div>
                            </>
                            }
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

export default Dashboard