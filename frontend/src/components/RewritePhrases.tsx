import { isAuth, setAuthInLocalStorage, trueStr, type WordPhrase } from "@/commons"
import api from "../api"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"

interface WordPhraseResponse {
    phrase: string
    sentence: string
    isSentenceGenerated: boolean
}

const RewritePhrases = () => {

    const wordBank = useRef<WordPhraseResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [currentSentence, setCurrentSentence] = useState<string>("")
    const [loadingSentence, setLoadingSentence] = useState<boolean>(false)

    useEffect(() => {
        const getWordBank = async () => {
            try {
                const resp = await api.get('/wordbank')

                resp.data.forEach((row: WordPhrase) => {
                    wordBank.current.push({phrase: row.word_phrase, sentence: "", isSentenceGenerated: false})
                })

                localStorage.setItem(isAuth, trueStr)

            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error fetching user word-bank", error)
            } finally {
                setLoading(false)
            }
        }

        getWordBank()
    }, [])

    const nextWordPhrase = () => {
        if (currentIndex + 1 < wordBank.current.length) {
            setCurrentIndex(prevIndex => prevIndex + 1)
            setCurrentSentence(wordBank.current[currentIndex + 1].sentence)
        }
    }

    const prevWordPhrase = () => {
        if (currentIndex - 1 >= 0) {
            setCurrentIndex(prevIndex => prevIndex - 1)
            setCurrentSentence(wordBank.current[currentIndex - 1].sentence)
        }
    }

    const generateSentence = async () => {
        if (wordBank.current[currentIndex].isSentenceGenerated) {
            return
        }

        try {
            setLoadingSentence(true)
            const resp = await api.get('/ai/rewritephrase/' + wordBank.current[currentIndex].phrase)
            
            wordBank.current[currentIndex].sentence = resp.data.sentence
            wordBank.current[currentIndex].isSentenceGenerated = true
            
            setLoadingSentence(false)
            setCurrentSentence(resp.data.sentence)

        } catch (error) {
            console.error("Error generating sentence", error)
        }
    }

    if (loading) {
        return <Loading spinnerAction="Loading"/>
    }

    return (
        <div className="flex flex-col justify-center w-full">
            <div className="flex justify-center mb-10">
                <Button className="bg-neutral-500 hover:bg-neutral-400" onClick={prevWordPhrase}>Previous</Button>
                <Button className="bg-green-600 hover:bg-green-500 ml-4" onClick={nextWordPhrase}>Next</Button>
            </div>

            <div className="flex flex-col justify-center items-center">
                <span className="flex justify-center mb-4">
                    <h2><b>Phrase:</b></h2>
                    <p className="ml-2">{wordBank.current[currentIndex].phrase}</p>
                </span>

                <Button className="w-fit mb-4" onClick={generateSentence}>Generate Sentence</Button>

                <div>
                    {loadingSentence ? <Spinner /> : <p>{currentSentence}</p>}
                </div>
            </div>
        </div>
    )
}

export default RewritePhrases