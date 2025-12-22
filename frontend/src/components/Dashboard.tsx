import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import api from "../api"
import {falseStr, initAuthInLocalStorage, isAuth, setAuthInLocalStorage, trueStr } from "../commons"
import Loading from "./Loading"

const Dashboard = () => {

    const [loading, setLoading] = useState<boolean>(true)

    const navigate = useNavigate()

    const goToWordBank = () => {
        navigate("/wordbank")
    }

    const goToVocabulary = () => {
        navigate("/vocabulary")
    }

    initAuthInLocalStorage()

    useEffect(() => {
        const getAuth = async () => {
            if (localStorage.getItem(isAuth) === falseStr){
                try {
                    await api.get('/auth/me')

                    localStorage.setItem(isAuth, trueStr)

                } catch (error: any) {
                    setAuthInLocalStorage(error)
                    console.error("Error checking authentication", error)
                } finally {
                    setLoading(false)
                }
            }
        }

        getAuth()
    }, [])

    if (localStorage.getItem(isAuth) === falseStr && loading) {
        return <Loading/>
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to={"/"} replace/>
    }

    const logoutUser = async () => {
        try {
            localStorage.setItem(isAuth, falseStr)
            window.location.href = "http://localhost:8000/auth/logout"
            
        } catch(error) {
            console.error("Error logging user out", error)
        }
    }

    return (
        <div className="flex flex-col justify-center items-center gap-y-5">
            <h1>Dashboard</h1>
            <Button key="user-word-bank-btn" onClick={goToWordBank}>Your Word-Bank</Button>
            <Button key="learn-vocab-btn" onClick={goToVocabulary}>Learn Vocabulary</Button>
            <Button key="logout-btn" className="bg-red-700 hover:bg-red-400" onClick={logoutUser}>Logout</Button>
        </div>
    )
}

export default Dashboard