import { falseStr, isAuth, setAuthInLocalStorage, trueStr, type GrammarCheckResponse, type GrammarMistakeGroup, type MistakeAndHint, type WordPhrase } from "../commons"
import api from "../api"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import { Input } from "./ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Navigate } from "react-router-dom"

interface WordPhraseResponse {
    phraseID: number
    phrase: string
    generatedSentence: string
    userSentence: string
    isSentenceGenerated: boolean
    vectorEmbedID?: number
    isResponseReviewed: boolean
    similarity: number
    userResult: string
    userGrammarMistakes: GrammarCheckResponse
    isFoundMistakes: boolean
}

const RewritePhrases = () => {

    const wordBank = useRef<WordPhraseResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    const [loadingSentence, setLoadingSentence] = useState<boolean>(false)
    const [_, setRefresh] = useState<number>(0)

    useEffect(() => {
        const getWordBank = async () => {
            try {
                const resp = await api.get('/wordbank')

                resp.data.forEach((row: WordPhrase) => {
                    wordBank.current.push({phraseID: row.word_id, phrase: row.word_phrase, generatedSentence: "", userSentence: "", isSentenceGenerated: false, isResponseReviewed: false, similarity: 0.0, userResult: "", userGrammarMistakes: {grammar_check: []}, isFoundMistakes: false })
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
            const resp = await api.get('/ai/generate-sentence/' + wordBank.current[currentIndex].phraseID)
            
            if (resp.data.sentence && resp.data.new_embed_id) {
                wordBank.current[currentIndex].generatedSentence = resp.data.sentence
                wordBank.current[currentIndex].vectorEmbedID = resp.data.new_embed_id
                wordBank.current[currentIndex].isSentenceGenerated = true
            }
            
            setLoadingSentence(false)

        } catch (error) {
            console.error("Error generating sentence", error)
        }
    }

    const reviewUserResponse = async () => {

        

        if (wordBank.current[currentIndex].userSentence.trim().length === 0 || !wordBank.current[currentIndex].vectorEmbedID || !wordBank.current[currentIndex].userSentence.trim().toLowerCase().includes(wordBank.current[currentIndex].phrase.toLowerCase())) {
            wordBank.current[currentIndex].isFoundMistakes = true
            setRefresh(prev => prev + 1)
        } else {
            wordBank.current[currentIndex].isFoundMistakes = false
        }

        if (!wordBank.current[currentIndex].isFoundMistakes) {
            try {
                setLoadingSentence(true)

                const grammarCheckResp = await api.get("/ai/grammar-check/" + wordBank.current[currentIndex].userSentence)

                wordBank.current[currentIndex].userGrammarMistakes = grammarCheckResp.data

                if (wordBank.current[currentIndex].userGrammarMistakes.grammar_check.length > 0) {
                    wordBank.current[currentIndex].isFoundMistakes = true
                } else {
                    wordBank.current[currentIndex].isFoundMistakes = false
                }
                
                if (!wordBank.current[currentIndex].isFoundMistakes) {

                    const similarityResp = await api.get("/ai/review-user-response/" + wordBank.current[currentIndex].userSentence + "/" + wordBank.current[currentIndex].vectorEmbedID)

                    wordBank.current[currentIndex].isResponseReviewed = true
                    wordBank.current[currentIndex].similarity = Number((similarityResp.data["similarity"] * 100).toFixed(2))

                    const similarity = wordBank.current[currentIndex].similarity

                    if (similarity >= 70.0 && similarity <= 95) {
                        wordBank.current[currentIndex].userResult = "Well done!"
                    } else if (similarity > 95) {
                        wordBank.current[currentIndex].userResult = "Your sentence is too similar. Please try again!"
                    } else {
                        wordBank.current[currentIndex].userResult = "Can be improved"
                    }
                }

            } catch (error) {
                console.error("Error reviewing user sentence", error)
            } finally {
                setLoadingSentence(false)
            }
        }
    }

    if (loading) {
        return <Loading spinnerAction="Loading"/>
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to={"/"} replace/>
    }

    return (
        <div className="flex flex-col justify-center w-full bg-neutral-100 rounded-md p-4">
            <div className="flex justify-center mb-10">
                <Button className="bg-zinc-500 hover:bg-neutral-400" onClick={prevWordPhrase}>Previous</Button>
                <Button className={`${wordBank.current[currentIndex].isSentenceGenerated ? "bg-teal-600 hover:bg-teal-500" : "bg-cyan-600 hover:bg-cyan-500"} ml-4`} onClick={nextWordPhrase}>
                    {wordBank.current[currentIndex].isSentenceGenerated ? "Continue" : "Skip"}
                </Button>
            </div>

            <div className="flex flex-col justify-center items-center">
                <span className="flex justify-center mb-4">
                    <h2><b>Phrase:</b></h2>
                    <p className="ml-2">{wordBank.current[currentIndex].phrase}</p>
                </span>

                {wordBank.current[currentIndex].isSentenceGenerated == false && <Button className="bg-teal-600 hover:bg-teal-500 w-fit mb-4" onClick={generateSentence} disabled={wordBank.current[currentIndex].isSentenceGenerated}>Generate Sentence</Button>}

                
                {loadingSentence && wordBank.current[currentIndex].isSentenceGenerated == false ?
                    <Spinner /> : 
                    wordBank.current[currentIndex].isSentenceGenerated && <p><b>Generated Sentence: </b>{wordBank.current[currentIndex].generatedSentence}</p>
                }

                {wordBank.current[currentIndex].isSentenceGenerated && <div className="mt-4 w-full justify-center items-center flex flex-col ">
                    <Input
                        key="user-sentence-input"
                        type="text"
                        placeholder="Re-phrase the sentence here..."
                        defaultValue={wordBank.current[currentIndex].userSentence}
                        onChange={(e) => {
                            if (e.target.value.length <= 255) {
                                wordBank.current[currentIndex].userSentence = e.target.value
                            }
                        }}
                        className="w-3/4"
                        disabled={wordBank.current[currentIndex].userGrammarMistakes.grammar_check.length == 0 && wordBank.current[currentIndex].similarity >= 70.0} />

                    {loadingSentence ? 
                        <Spinner className="mt-2" /> : 
                        wordBank.current[currentIndex].isResponseReviewed || wordBank.current[currentIndex].isFoundMistakes ?
                            <Card className="mt-4 bg-neutral-100">
                                <CardHeader className="text-2xl text-center">
                                    <CardTitle className={`${wordBank.current[currentIndex].isFoundMistakes ? "text-red-600" : "text-primary"}`}>
                                        { wordBank.current[currentIndex].isFoundMistakes  ? 
                                            "Mistakes/Erros Found!" : "Similarity Result"
                                        }
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    { wordBank.current[currentIndex].isFoundMistakes ? 
                                        <div className="text-red-600">
                                            {!wordBank.current[currentIndex].vectorEmbedID && <p>System failure on saving the generated sentence</p>}

                                            {wordBank.current[currentIndex].userSentence.trim().length === 0 && <p>Empty response</p>}

                                            {!wordBank.current[currentIndex].userSentence.toLowerCase().includes(wordBank.current[currentIndex].phrase.toLowerCase()) && 
                                                <p>No usage of the word-phrase in the sentence</p>
                                            }

                                            {wordBank.current[currentIndex].userGrammarMistakes.grammar_check.map((mistakeTypeList: GrammarMistakeGroup) => (
                                                <div className="bg-red-200 rounded-lg p-2 mt-3">
                                                    <div className="mb-2"><b className="text-lg">{mistakeTypeList.mistake_type}</b></div>
                                                    <ol type="1" className="list-decimal pl-10">
                                                        {mistakeTypeList.mistakes.map((mistake: MistakeAndHint) => (
                                                            <div className="mt-2">
                                                                <li>{mistake.mistake}
                                                                    <ul className="pl-6">
                                                                        <li>- <b>Hint: </b>{mistake.hint}</li>
                                                                    </ul>
                                                                </li>
                                                            </div>
                                                        ))}
                                                    </ol>
                                                </div>
                                            ))}
                                        </div> :
                                        <div>
                                            <p className="mt-2"><b>Similarity:</b> {wordBank.current[currentIndex].similarity}%</p>
                                            <p><b>Feedback:</b> {wordBank.current[currentIndex].userResult}</p>
                                        </div>
                                    }
                                    
                                </CardContent>
                                
                                {(wordBank.current[currentIndex].userGrammarMistakes.grammar_check.length > 0 || wordBank.current[currentIndex].similarity < 70.0) && 
                                    <CardFooter className="justify-center">
                                        <div className="text-center">
                                            <p className="text-xs text-neutral-400">Change your response first, then click Try Again</p>
                                            <Button className="bg-teal-600 hover:bg-teal-500 mt-2" onClick={reviewUserResponse}>Try Again</Button>
                                        </div>
                                    </CardFooter>
                                }
                            </Card> :
                            <Button className="bg-teal-600 hover:bg-teal-500 mt-4" onClick={reviewUserResponse} >Review with AI</Button>
                    }

                </div>}
            </div>
        </div>
    )
}

export default RewritePhrases