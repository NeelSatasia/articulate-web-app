import { Navigate } from "react-router-dom"

export const isAuth = "isAuth"
export const trueStr = "true"
export const falseStr = "false"

export const initAuthInLocalStorage = () => {
    if (localStorage.getItem(isAuth) === null) {
        localStorage.setItem(isAuth, falseStr)
    }
}

export const setAuthInLocalStorage = (error: any) => {
    if (error.response?.status === 401) {
        localStorage.setItem(isAuth, falseStr)
    }
}

export const exitIfSignedOut = () => {
    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to="/" replace />
    }
}