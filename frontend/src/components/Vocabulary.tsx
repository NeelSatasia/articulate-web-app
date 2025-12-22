import { Navigate } from "react-router-dom";

const Vocabulary = () => {

    if (localStorage.getItem("isAuth")) {
        return <Navigate to="/" replace />
    }

    return (
        <div>Vocabulary</div>
    )
}

export default Vocabulary