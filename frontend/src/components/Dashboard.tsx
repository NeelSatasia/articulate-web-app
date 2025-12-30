import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api"
import {falseStr, initAuthInLocalStorage, isAuth, loadingStr, setAuthInLocalStorage, trueStr, userName, type VocabularyWord, type WordPhrase } from "../commons"
import Loading from "./Loading"
import { Table, TableBody, TableCell, TableRow } from "./ui/table"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    initAuthInLocalStorage()

    const [wordPhrases, setWordPhrases] = useState<Map<number, string>>(new Map())
    const [newVocabulary, setNewVocabulary] = useState<Map<number, string[]>>(new Map())

    useEffect(() => {
        const getAuth = async () => {
            try {
                const resp = await api.get("/auth/me")

                localStorage.setItem(isAuth, trueStr)
                localStorage.setItem(userName, resp.data["name"])
                
                const resp2 = await api.get("/wordbank/dashboard")

                const tempData = new Map<number, string>()

                resp2.data.forEach((row: WordPhrase) => {
                    tempData.set(row.word_id, row.word_phrase)
                })

                const resp3 = await api.get("/vocabulary/dashboard")
                
                const tempVocabData = new Map<number, string[]>()

                resp3.data.forEach((row: VocabularyWord) => {
                    tempVocabData.set(row.vocab_word_id, [row.word, row.definition])
                })
            
                setWordPhrases(tempData)
                setNewVocabulary(tempVocabData)
            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error checking authentication", error)
            } finally {
                setLoading(false)
            }
        }

        getAuth()
    }, [])

    if (localStorage.getItem(isAuth) === falseStr && loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to={"/"} replace/>
    }

    return (
        <div className="flex flex-col justify-center items-center gap-y-5">
            <div className="w-full p-2 outline-2 outline-offset outline-primary rounded">
                <h1 className="text-3xl mb-2">Today's Word Phrases</h1>
                <Table key="dashboard-word-phrases" className="rounded bg-neutral-100">
                    <TableBody key="word-phrases-content">
                        {Array.from(wordPhrases).map(([wordID, wordPhrase]) => (
                            <TableRow key={"dashboard-word-phrase-row-" + wordID}>
                                <TableCell key={"dashboard-word-phrase-" + wordID} className="rounded hover:bg-primary hover:text-secondary">
                                    {wordPhrase}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="w-full p-2 outline-2 outline-offset outline-primary rounded">
                <h1 className="text-3xl mb-2">Today's Vocabulary</h1>
                <Table key="dashboard-new-vocabulary" className="rounded bg-neutral-100">
                    <TableBody key="new-vocabulary-content">
                        {Array.from(newVocabulary).map(([vocabWordID, vocabWord]) => (
                            <TableRow key={"dashboard-new-vocabulary-row-" + vocabWordID} className="hover:bg-primary hover:text-secondary rounded">
                                <TableCell key={"dashboard-new-vocabulary-" + vocabWordID} className="rounded-l-md">
                                    {vocabWord[0]}
                                </TableCell>
                                <TableCell key={"dashboard-new-vocabulary-definition-" + vocabWordID} className="rounded-r-md">
                                    {vocabWord[1]}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default Dashboard