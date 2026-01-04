import { initAuthInLocalStorage } from "./commons"
import { Button } from "./components/ui/button"

function App() {

    initAuthInLocalStorage()

    const googleSign = () => {
        window.location.href =  "http://localhost:8000/auth/login"
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-sm text-center">
                <h1 className="text-2xl font-bold mb-6">Welcome</h1>
                <p className="text-gray-500 mb-6">Sign in with your Google account to continue</p>
                <Button
                    onClick={googleSign}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg shadow-md transition-colors"
                >
                    Sign In with Google
                </Button>
            </div>
        </div>
    )
}

export default App