import { isAuth, setAuthInLocalStorage, trueStr, type WordPhrase } from "@/commons"
import api from "../api"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import { Input } from "./ui/input"

interface WordPhraseResponse {
    phrase: string
    generatedSentence: string
    userSentence: string
    isSentenceGenerated: boolean
}

const RewritePhrases = () => {

    const wordBank = useRef<WordPhraseResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [loadingSentence, setLoadingSentence] = useState<boolean>(false)

    useEffect(() => {
        const getWordBank = async () => {
            try {
                const resp = await api.get('/wordbank')

                resp.data.forEach((row: WordPhrase) => {
                    wordBank.current.push({phrase: row.word_phrase, generatedSentence: "", userSentence: "", isSentenceGenerated: false})
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
        }
    }

    const prevWordPhrase = () => {
        if (currentIndex - 1 >= 0) {
            setCurrentIndex(prevIndex => prevIndex - 1)
        }
    }

    const generateSentence = async () => {
        if (wordBank.current[currentIndex].isSentenceGenerated) {
            return
        }

        try {
            setLoadingSentence(true)
            const resp = await api.get('/ai/rewritephrase/' + wordBank.current[currentIndex].phrase)
            
            wordBank.current[currentIndex].generatedSentence = resp.data.sentence
            wordBank.current[currentIndex].isSentenceGenerated = true
            
            setLoadingSentence(false)

        } catch (error) {
            console.error("Error generating sentence", error)
        }
    }

    const submitUserResponse = async () => {
        if (wordBank.current[currentIndex].userSentence.trim().length === 0) {
            return
        }

        try {
            setLoadingSentence(true)

            // Yet to implement backend route for this
            const resp = await api.post('/ai/reviewsentence', {
                phrase: wordBank.current[currentIndex].phrase,
                userSentence: wordBank.current[currentIndex].userSentence
            })

            wordBank.current[currentIndex].generatedSentence = resp.data.reviewedSentence

        } catch (error) {
            console.error("Error reviewing user sentence", error)
        } finally {
            setLoadingSentence(false)
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

                {wordBank.current[currentIndex].isSentenceGenerated == false && <Button className="w-fit mb-4" onClick={generateSentence} disabled={wordBank.current[currentIndex].isSentenceGenerated}>Generate Sentence</Button>}

                
                {loadingSentence ? <Spinner /> : <p>{wordBank.current[currentIndex].generatedSentence}</p>}

                {wordBank.current[currentIndex].isSentenceGenerated && <div className="mt-4 w-full justify-center items-center flex flex-col gap-y-4">
                    <Input
                        type="text"
                        placeholder="Re-phrase the sentence here..."
                        defaultValue={wordBank.current[currentIndex].userSentence}
                        onChange={(e) => {
                            wordBank.current[currentIndex].userSentence = e.target.value
                        }}
                        className="w-3/4"
                    />

                    <Button className="bg-teal-600 hover:bg-teal-500" onClick={submitUserResponse}>Review with AI</Button>
                </div>}
            </div>
        </div>
    )
}

export default RewritePhrases