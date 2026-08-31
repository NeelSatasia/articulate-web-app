import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type WordPhrase} from "../commons"
import Loading from "./Loading"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import { Button } from "./ui/button"
import { useNavigate } from "react-router-dom"

const Dashboard = () => {

    const navigate = useNavigate()
    const [loading, setLoading] = useState<boolean>(true)
    const [words, setWords] = useState<WordPhrase[]>([])

    useEffect(() => {
        const getWords = async () => {
            try {
                const resp = await api.get("/wordbank")
                localStorage.setItem(isAuth, trueStr)
                setWords(resp.data)
            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error checking authentication", error)
            } finally {
                setLoading(false)
            }
        }

        getWords()
    }, [])

    const categories = (() => {
        const rows: { id: string; title: string; color: string; words: WordPhrase[] }[] = [
            { id: "needs-review", title: "Needs review", color: "text-red-600", words: [] },
            { id: "getting-there", title: "Getting there", color: "text-orange-500", words: [] },
            { id: "strong", title: "Strong", color: "text-green-600", words: [] },
            { id: "not-attempted-yet", title: "Not attempted yet", color: "text-gray-500", words: [] }
        ]

        for (const word of words) {
            if (word.last_attempted_at === null) {
                rows[3].words.push(word)
                continue
            }

            const avg = Number(word.avg_success_attempts ?? 0)
            const successAttempts = Number(word.success_attempts ?? 0)

            if (avg > 2.0 || successAttempts == 0) {
                rows[0].words.push(word)
            }

            else if (avg <= 1.1 && successAttempts >= 20) {
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
            <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

            <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-4">
                {categories.map((c) => (
                    <AccordionItem key={c.id} value={c.id}>
                        <AccordionTrigger className={`text-xl font-semibold ${c.color}`}>{c.title} ({c.words.length})</AccordionTrigger>
                        <AccordionContent>
                            <div className="mb-3">
                                <Button onClick={() => goToPlayground(c.id, c.words)}>Practice</Button>
                            </div>
                            <ul className="space-y-2">
                                {c.words.map(w => (
                                    <li key={w.word_id} className="flex justify-between items-center p-2 rounded border bg-white/5">
                                        <span>{w.word_phrase}</span>
                                        <small className="text-muted-foreground">{w.last_attempted_at ? `Last: ${new Date(w.last_attempted_at).toLocaleDateString()}` : "Not yet attempted"}</small>
                                    </li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

export default Dashboard