import { Navigate } from "react-router-dom"
import api from "../api"
import { isAuth, loadingStr, trueStr, type VocabularyWord } from "../commons"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Spinner } from "./ui/spinner"

interface RecallWordInfo {
    basicInfo: VocabularyWord
    generatedSentence: string
    status: number
}

const VocabularyRecall = () => {

    const vocabularyWords = useRef<VocabularyWord[]>([])
    const shuffledVocabularyWords = useRef<RecallWordInfo[]>([])
    const [currentIdx, setCurrentIdx] = useState<number>(0)

    const [loading, setLoading] = useState<boolean>(true)
    const [loadingSentence, setLoadingSentence] = useState(false)

    useEffect(() => {
        const getUserVocabulary = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/vocabulary")
                    
                    localStorage.setItem(isAuth, trueStr)
                    vocabularyWords.current = resp.data
                }
            } catch (error) {
                console.error("Error fetching user vocabulary", error)
            } finally {
                setLoading(false)
            }
        }

        getUserVocabulary()
    }, [])

    const nextWord = async () => {
        if (currentIdx + 1 >= shuffledVocabularyWords.current.length && shuffledVocabularyWords.current.length < vocabularyWords.current.length && vocabularyWords.current.length > 0) {
            const randomIndex = Math.floor(Math.random() * shuffledVocabularyWords.current.length)
            
            try {
                setLoadingSentence(true)
                const resp = await api.get("/ai/generate-sentence-for-word/" + vocabularyWords.current[randomIndex].word)

                shuffledVocabularyWords.current.push({basicInfo: vocabularyWords.current[randomIndex], generatedSentence: resp.data["sentence"], status: 0})
                vocabularyWords.current.splice(randomIndex, 1)
            } catch (error) {
                console.error("Error fetching user vocabulary", error)
            } finally {
                setLoadingSentence(false)
            }


            setCurrentIdx(prev => prev + 1)
        }
    }

    const prevWord = () => {
        if (currentIdx - 1 >= 0) {
            setCurrentIdx(prev => prev - 1)
        }
    }

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    return (
        <div className="flex flex-col gap-y-4 p-4 justify-center items-center">
            <div className="flex flex-row gap-x-4">
                <Button onClick={prevWord}>Previous</Button>
                <Button onClick={nextWord}>Next</Button>
            </div>

            {loadingSentence ? <Spinner /> : <Label>{shuffledVocabularyWords.current[currentIdx].generatedSentence}</Label>}
            
            <div className="flex flex-col gay-y-4">
                {shuffledVocabularyWords.current[currentIdx].status === 0 && <Input id="input-user-word" placeholder="Enter word here..." />}
                {shuffledVocabularyWords.current[currentIdx].status <= 1 && <Button className={`${shuffledVocabularyWords.current[currentIdx].status === 0 ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>{shuffledVocabularyWords.current[currentIdx].status === 0 ? "Submit" : "Try Again"}</Button>}
                {shuffledVocabularyWords.current[currentIdx].status === 2 && <Label className="">Well done!</Label>}
            </div>

        </div>
    )
}

export default VocabularyRecall