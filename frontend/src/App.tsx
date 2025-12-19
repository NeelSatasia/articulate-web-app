import { Button } from "./components/ui/button"

function App() {

    const googleSign = () => {
        window.location.href = "http://localhost:8000/auth/login"
    }


    return (
    <>
        <Button onClick={googleSign}>Google Sign In</Button>
    </>
    )
}

export default App