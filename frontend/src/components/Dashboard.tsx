import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import api from "../api"
import { falseStr, isAuth, trueStr } from "../context"

const Dashboard = () => {

    const [checkAuth, setAuth] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)

    const navigate = useNavigate()

    const goToWordBank = () => {
        navigate("/wordbank")
    }

    const goToVocabulary = () => {
        navigate("/vocabulary")
    }

    if (localStorage.getItem(isAuth) === null) {
        localStorage.setItem(isAuth, falseStr)
    }

    
    useEffect(() => {
        const getAuth = async () => {
            if (localStorage.getItem(isAuth) === falseStr){
                try {
                    await api.get('/auth/me')

                    localStorage.setItem(isAuth, trueStr)
                    setAuth(true)

                } catch (error: any) {
                    localStorage.setItem(isAuth, falseStr)
                    setAuth(false)
                    console.error("Error checking authentication", error)
                } finally {
                    setLoading(false)
                }
            }
        }

        getAuth()
    }, [])

    if (loading) {
        return <div>Loading dashboard ...</div>
    }

    if (!checkAuth) {
        return <Navigate to={"/"} replace/>
    }

    return (
        <div className="flex items-center">
            <h1>Dashboard</h1>
            <Button key="user-word-bank-btn" onClick={goToWordBank}>Your Word-Bank</Button>
            <Button key="learn-vocab-btn" onClick={goToVocabulary}>Learn Vocabulary</Button>
        </div>
    )
}

export default Dashboard