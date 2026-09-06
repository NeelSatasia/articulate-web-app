import { useEffect, useState } from "react"
import { isAuth, setAuthInLocalStorage, trueStr } from "../commons"
import api from "../api"
import Loading from "./Loading"
import { Navigate } from "react-router-dom"

const Settings = () => {

    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        const getUserData = async () => {
            setLoading(true)
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    await api.get("/auth/check")
                    
                    localStorage.setItem(isAuth, trueStr)
                }
            } catch (error) {
                setAuthInLocalStorage(error)
                console.error("Error fetching user vocabulary", error)
            } finally {
                setLoading(false)
            }
        }

        getUserData()
    }, [])

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    if (loading) {
        return <Loading spinnerAction="Loading" />
    }

    return (
        <div className="p-4">
        </div>
    )
}

export default Settings