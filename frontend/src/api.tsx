import axios from "axios"
import { backendServiceURL } from "./commons"

const api = axios.create({
    baseURL: backendServiceURL,
    withCredentials: true
})



export default api