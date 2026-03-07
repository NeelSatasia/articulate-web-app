import { Navigate } from "react-router-dom"
import api from "../api"
import { isAuth, loadingStr, setAuthInLocalStorage, trueStr, type VocabularyWord } from "../commons"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Spinner } from "./ui/spinner"

interface RecallWordInfo {
    basicInfo: VocabularyWord
    generatedSentence: string
    userAnswer: string
    status: number
}

const VocabularyRecall = () => {

    const vocabularyWords = useRef<VocabularyWord[]>([])
    const shuffledVocabularyWords = useRef<RecallWordInfo[]>([])
    const [currentIdx, setCurrentIdx] = useState<number>(-1)

    const [loading, setLoading] = useState<boolean>(true)
    const [loadingSentence, setLoadingSentence] = useState(false)

    const [_, setManualReload] = useState(1)

    useEffect(() => {
        const getUserVocabulary = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/vocabulary")
                    
                    localStorage.setItem(isAuth, trueStr)
                    vocabularyWords.current = resp.data
                }
            } catch (error) {
                setAuthInLocalStorage(error)
                console.error("Error fetching user vocabulary", error)
            } finally {
                setLoading(false)
            }
        }

        getUserVocabulary()
    }, [])

    const nextWord = async () => {
        if (currentIdx + 1 >= shuffledVocabularyWords.current.length && shuffledVocabularyWords.current.length < vocabularyWords.current.length && vocabularyWords.current.length > 0) {
            const randomIndex = Math.floor(Math.random() * vocabularyWords.current.length)
            
            try {
                setLoadingSentence(true)
                const resp = await api.get("/ai/generate-sentence-for-word/" + vocabularyWords.current[randomIndex].word)

                shuffledVocabularyWords.current.push({basicInfo: vocabularyWords.current[randomIndex], generatedSentence: resp.data["sentence"], userAnswer: "", status: 0})
                vocabularyWords.current.splice(randomIndex, 1)
            } catch (error) {
                setAuthInLocalStorage(error)
                console.error("Error fetching user vocabulary", error)
            } finally {
                setLoadingSentence(false)
            }
        }

        setCurrentIdx(prev => prev + 1)
    }

    const prevWord = () => {
        setCurrentIdx(prev => prev - 1)
    }

    const checkAnswer = () => {
        const cleanedAnswer = shuffledVocabularyWords.current[currentIdx].userAnswer.trim().toLowerCase()
        if (cleanedAnswer === shuffledVocabularyWords.current[currentIdx].basicInfo.word) {
            shuffledVocabularyWords.current[currentIdx].status = 2
        } else if (shuffledVocabularyWords.current[currentIdx].status != 1) {
            shuffledVocabularyWords.current[currentIdx].status = 1
        }

        setManualReload(prev => -1 * prev)
        console.log(shuffledVocabularyWords.current[currentIdx].userAnswer)
    }

    const changeUserAnswer = (newValue: string) => {
        if (currentIdx >= 0) {
            shuffledVocabularyWords.current[currentIdx].userAnswer = newValue
            setManualReload(prev => -1 * prev)
        }
    }

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    return (
        <div className="flex flex-col gap-y-10 p-4 justify-center items-center">
            <div className="flex flex-row gap-x-4">
                <Button className="bg-white hover:bg-primary text-primary hover:text-white border border-black" onClick={prevWord} disabled={currentIdx <= 0}>Back</Button>
                <Button onClick={nextWord} disabled={currentIdx >= vocabularyWords.current.length - 1}>Next</Button>
            </div>

            {currentIdx === -1 && loadingSentence ? <Spinner /> : currentIdx === -1 ? <Label className="text-neutral-500 italic">{vocabularyWords.current.length === 0 ? "Your vocabulary collection is currently empty!" : "Click next to begin"}</Label> : 

            loadingSentence ? <Spinner /> :
                <>
                    <Label>{shuffledVocabularyWords.current[currentIdx].generatedSentence}</Label>
        
                    <div className="flex flex-col gap-y-4 justify-center items-center">
                        <Input id="input-user-word" placeholder="Enter word here..." value={shuffledVocabularyWords.current[currentIdx].userAnswer} onChange={e => changeUserAnswer(e.target.value)} disabled={shuffledVocabularyWords.current[currentIdx].status === 2}/>
                        {shuffledVocabularyWords.current[currentIdx].status <= 1 && <Button className="bg-emerald-600 hover:bg-emerald-500 w-fit" onClick={checkAnswer}>Check</Button>}
                        {shuffledVocabularyWords.current[currentIdx].status === 1 ? <Label className="text-red-500">Incorrect, please try again!</Label> : shuffledVocabularyWords.current[currentIdx].status === 2 && <Label className="text-green-500">Well done!</Label>}
                    </div>
                </>
            }

        </div>
    )
}

export default VocabularyRecall