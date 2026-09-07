import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import WordBank from './components/WordBank.tsx'
import Dashboard from './components/Dashboard.tsx'
import Layout from './components/Layout.tsx'
import Playground from './components/Playground.tsx'

const router = createBrowserRouter([
    {path: "/", element: <App />},
    {path: "/",
        element: <Layout />,
        children: [
            { index: true, path: "dashboard", element: <Dashboard /> },
            { path: "wordbank", element: <WordBank /> },
            { path: "playground", element: <Playground /> }
        ]
    }
])

createRoot(document.getElementById('root')!).render(
    
    <RouterProvider router={router} />
    
)
