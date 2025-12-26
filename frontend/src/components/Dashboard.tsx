import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api"
import {falseStr, initAuthInLocalStorage, isAuth, loadingStr, setAuthInLocalStorage, trueStr, userName, type WordPhrase } from "../commons"
import Loading from "./Loading"
import { Table, TableBody, TableCell, TableRow } from "./ui/table"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    initAuthInLocalStorage()

    const [wordPhrases, setWordPhrases] = useState<Map<number, string>>(new Map())

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
            
                setWordPhrases(tempData)
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
            <div className="w-full rounded bg-neutral-100 p-2">
                <Table key="dashboard-word-phrases">
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
        </div>
    )
}

export default Dashboard