import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import WordBank from './components/WordBank.tsx'
import Dashboard from './components/Dashboard.tsx'
import Vocabulary from './components/Vocabulary.tsx'
import Layout from './components/Layout.tsx'
import RewritePhrases from './components/RewritePhrases.tsx'

const router = createBrowserRouter([
  {path: "/", element: <App />},
  {path: "/",
    element: <Layout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "wordbank", element: <WordBank /> },
      { path: "vocabulary", element: <Vocabulary /> },
      { path: "rewritephrases", element: <RewritePhrases /> }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
)
