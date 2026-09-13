import { AuthError, ErrorAlertDialog, falseStr, getErrorDetail, isAuth, trueStr, type ErrorAlert, type Situation } from "../commons"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"
import api from "../api"
import { Spinner } from "./ui/spinner"
import { Navigate } from "react-router-dom"
import { Textarea } from "./ui/textarea"


const Explain = () => {

    const [error, setError] = useState<ErrorAlert>({title: "", detail: ""})
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const [situation, setSituation] = useState<Situation>({ situation: "" })
    const [userResponse, setUserResponse] = useState<string>("")

    const generateSituation = async () => {
        setIsLoading(true)
        try {
            const response = await api.get("/ai/generate-situation")

            if (response.data) {
                setSituation(response.data)
            }
    
        } catch (err: any) {
            const statusCode = Number(err.response.data.detail.split(":")[0])
            
            if (statusCode === 401) {
                localStorage.setItem(isAuth, falseStr)
                setError(AuthError)
            } 
            
            else {
                setError({title: "Error Generating A Situation", detail: getErrorDetail(err)})
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const getAuth = async () => {
            try {
                await api.get("auth/check")
                localStorage.setItem(isAuth, trueStr)
            } catch (err: any) {
                const statusCode = Number(err.response.data.detail.split(":")[0])
                
                if (statusCode === 401) {
                    localStorage.setItem(isAuth, falseStr)
                    setError(AuthError)
                }
            }
        }

        getAuth()
    }, [])

    const preventAction = (e: any) => {
        e.preventDefault();
    };

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="flex flex-col items-center gap-y-4 p-4">
            <ErrorAlertDialog
                open={error.detail !== ""}
                errorDetail={error.detail}
                onOpenChange={(open) => {
                    if (!open) {
                        setError({ title: "", detail: "" })
                    }
                }}
                title={error.title}
            />

            <Button onClick={generateSituation} className="bg-sky-700 hover:bg-sky-600 text-primary" disabled={isLoading}>Generate</Button>

            {isLoading && <Spinner />}

            {situation.situation.length > 0 && !isLoading && (
                <div className="flex flex-col gap-y-4 w-3/4 items-center">
                    {userResponse.trim().length == 0 && <div className="bg-secondary rounded-lg p-4"><p className="font-medium text-primary">{situation.situation}</p></div>}
                    <Textarea 
                        placeholder="Explain it in your own words" 
                        defaultValue={userResponse} 
                        onChange={e => setUserResponse(e.target.value)}
                        onCopy={preventAction}
                        onPaste={preventAction}
                        onCut={preventAction}
                        disabled={isLoading} />

                    <Button className="w-fit bg-green-600 hover:bg-green-500 text-primary">Submit</Button>
                </div>

            )}
        </div>
    )
}

export default Explain