import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../api"
import {isAuth, loadingStr, setAuthInLocalStorage, trueStr, type VocabularyWord, type WordPhrase } from "../commons"
import Loading from "./Loading"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        const getAuth = async () => {
            try {
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
        <div className="flex w-full flex-col gap-6 px-4 py-6 text-left sm:px-6">
        </div>
    )
}

export default Dashboard