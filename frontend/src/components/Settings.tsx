import { useEffect, useState } from "react"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { isAuth, setAuthInLocalStorage, trueStr } from "../commons"
import api from "../api"
import Loading from "./Loading"
import { Navigate } from "react-router-dom"

const Settings = () => {

    const [dailyRecall, setDailyRecall] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        const getUserData = async () => {
            setLoading(true)
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/user")
                    
                    localStorage.setItem(isAuth, trueStr)
                    setDailyRecall(resp.data[0].daily_recall_email)
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

    const handleDailyRecallEmailSwitch = async (checked: boolean) => {

        try {
            await api.put(`/user/daily_recall_email/${checked}`)
            setDailyRecall(checked)

        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Failed to update daily recall switch", error)
        }
    }

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    if (loading) {
        return <Loading spinnerAction="Loading" />
    }

    return (
        <div className="p-4">
            <div className="flex flex-row p-2 bg-neutral-100 gap-x-4 w-fit rounded">
                <Label>Send a recall email everyday</Label>
                <Switch checked={dailyRecall} onCheckedChange={handleDailyRecallEmailSwitch} />
            </div>
        </div>
    )
}

export default Settings