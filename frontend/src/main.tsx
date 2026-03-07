import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import WordBank from './components/WordBank.tsx'
import Dashboard from './components/Dashboard.tsx'
import Vocabulary from './components/Vocabulary.tsx'
import Layout from './components/Layout.tsx'
import RewritePhrases from './components/RewritePhrases.tsx'
import EssenceWriting from './components/EssenceWriting.tsx'
import VocabularyRecall from './components/VocabularyRecall.tsx'
import Settings from './components/Settings.tsx'

const router = createBrowserRouter([
    {path: "/", element: <App />},
    {path: "/",
        element: <Layout />,
        children: [
            { index: true, path: "dashboard", element: <Dashboard /> },
            { path: "wordbank", element: <WordBank /> },
            { path: "vocabulary", element: <Vocabulary /> },
            { path: "sentence-crafting", element: <RewritePhrases /> },
            { path: "vocabulary-recall", element: <VocabularyRecall /> },
            { path: "essence-writing", element: <EssenceWriting /> },
            { path: "settings", element: <Settings /> }
        ]
    }
])

createRoot(document.getElementById('root')!).render(
    
    <RouterProvider router={router} />
    
)
