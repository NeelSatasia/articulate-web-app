import { Navigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import api from "../api"
import {falseStr, isAuth, loadingStr, setAuthInLocalStorage, trueStr, userName, type VocabularyWord, type WordPhrase } from "../commons"
import Loading from "./Loading"
import { Table, TableBody, TableCell, TableRow } from "./ui/table"
import { Button } from "./ui/button"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const [wordPhrases, setWordPhrases] = useState<Map<number, string>>(new Map())
    const [newVocabulary, setNewVocabulary] = useState<VocabularyWord[]>([])

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
                localStorage.setItem(userName, "User") // TODO: Replace with actual user name from backend
            
                setWordPhrases(tempData)
                setNewVocabulary(getCurrentVocab.data)
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

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to={"/"} replace/>
    }

    return (
        <div className="flex flex-col justify-center items-center gap-y-5 p-4">
            <div className="w-full p-2 outline outline-offset outline-primary rounded">
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

            <div className="w-full p-2 outline outline-offset outline-primary rounded">
                <h1 className="text-3xl mb-2">Today's Vocabulary</h1>
                <Table key="dashboard-new-vocabulary" className="rounded bg-neutral-100">
                    <TableBody key="new-vocabulary-content">
                        {newVocabulary.map(vocabulary => (
                            <TableRow key={"dashboard-new-vocabulary-row-" + vocabulary.word_id} className="hover:bg-primary hover:text-secondary rounded">
                                <TableCell key={"dashboard-new-vocabulary-" + vocabulary.word_id} className="rounded-l-md">
                                    {vocabulary.word}
                                </TableCell>
                                <TableCell key={"dashboard-new-vocabulary-definition-" + vocabulary.word_id} >
                                    {vocabulary.definition}
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