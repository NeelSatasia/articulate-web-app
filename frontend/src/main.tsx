import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import WordBank from './components/WordBank.tsx'
import Dashboard from './components/Dashboard.tsx'
import Vocabulary from './components/Vocabulary.tsx'

const router = createBrowserRouter([
    {path:"/", element: <App/>},
    {path:"/dashboard", element: <Dashboard/>},
    {path:"/wordbank", element: <WordBank/>},
    {path:"/vocabulary", element: <Vocabulary/>}
])

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
