import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type VocabularyWord, type WordPhrase } from "../commons"
import Loading from "./Loading"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const [todaysWordPhrases, setTodaysWordPhrases] = useState<Map<number, string>>(new Map())
    const [todaysVocabulary, setTodaysVocabulary] = useState<VocabularyWord[]>([])

    useEffect(() => {
        const getAuth = async () => {
            try {
                const getCurrentWP = await api.get("/wordbank/dashboard")

                const tempData = new Map<number, string>()

                getCurrentWP.data.forEach((row: WordPhrase) => {
                    tempData.set(row.word_id, row.word_phrase)
                })

                const getCurrentVocab = await api.get("/vocabulary/dashboard")

                localStorage.setItem(isAuth, trueStr)
            
                setTodaysWordPhrases(tempData)
                setTodaysVocabulary(getCurrentVocab.data)
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
        <div className="flex w-full flex-col gap-6 px-4 py-6 text-left sm:px-6">
            <section className="rounded-lg border bg-card p-4 text-card-foreground">
                <h2 className="text-2xl font-semibold">Today's Word-Phrases</h2>

                {todaysWordPhrases.size > 0 ? (
                    <ul className="mt-4 space-y-2">
                        {Array.from(todaysWordPhrases).map(([wordID, wordPhrase]) => (
                            <li
                                key={"dashboard-word-phrase-" + wordID}
                                className="rounded-md border bg-background px-3 py-2"
                            >
                                {wordPhrase}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                        Your word-phrases collection is currently empty. Navigate to Commonplace Book to add your word-phrases.
                    </p>
                )}
            </section>

            <section className="rounded-lg border bg-card p-4 text-card-foreground">
                <h2 className="text-2xl font-semibold">Today's Vocabulary</h2>

                {todaysVocabulary.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {todaysVocabulary.map((vocabulary) => (
                            <article
                                key={"dashboard-new-vocabulary-" + vocabulary.word_id}
                                className="rounded-lg border bg-background p-4 shadow-sm transition hover:shadow"
                            >
                                <h3 className="text-xl font-semibold">{vocabulary.word}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{vocabulary.definition}</p>
                                <p className="mt-3 text-sm italic">{vocabulary.example || "No example available yet."}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                        Your vocabulary collection is currently empty. Navigate to Vocabulary to search and add new vocabulary words.
                    </p>
                )}
            </section>
        </div>
    )
}

export default Dashboard