import { isAuth, setAuthInLocalStorage, trueStr, type GrammarMistake, type MistakeAndHint, type WordPhrase } from "../commons"
import api from "../api"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import { Input } from "./ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

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
    userGrammarMistakes: GrammarMistake[]
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
                    wordBank.current.push({phraseID: row.word_id, phrase: row.word_phrase, generatedSentence: "", userSentence: "", isSentenceGenerated: false, isResponseReviewed: false, similarity: 0.0, userResult: "", userGrammarMistakes: []})
                })

                console.log(wordBank.current)

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
        if (wordBank.current[currentIndex].userSentence.trim().length === 0 || !wordBank.current[currentIndex].vectorEmbedID) {
            return
        }

        try {
            setLoadingSentence(true)

            const grammarCheckResp = await api.get("/ai/grammar-check/" + wordBank.current[currentIndex].userSentence)

            wordBank.current[currentIndex].userGrammarMistakes = grammarCheckResp.data["grammar_check"]["mistakes"]
            
            if (wordBank.current[currentIndex].userGrammarMistakes.length == 0) {

                const similarityResp = await api.get("/ai/review-user-response/" + wordBank.current[currentIndex].userSentence + "/" + wordBank.current[currentIndex].vectorEmbedID)

                wordBank.current[currentIndex].isResponseReviewed = true
                wordBank.current[currentIndex].similarity = Number((similarityResp.data["similarity"] * 100).toFixed(2))

                const similarity = wordBank.current[currentIndex].similarity

                if (similarity >= 80.0 && similarity < 100) {
                    wordBank.current[currentIndex].userResult = "Good job!"
                } else if (similarity >= 70.0 && similarity < 80.0) {
                    wordBank.current[currentIndex].userResult = "Your sentence is almost matching!"
                } else if (similarity < 70.0) {
                    wordBank.current[currentIndex].userResult = "Failed to match the sentence!"
                } else {
                    wordBank.current[currentIndex].userResult = "Your sentence is too similar!"
                }
            }

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
        <div className="flex flex-col justify-center w-full bg-neutral-100 rounded-md p-4">
            <div className="flex justify-center mb-10">
                <Button className="bg-neutral-400 hover:bg-neutral-400" onClick={prevWordPhrase}>Previous</Button>
                <Button className="bg-primary ml-4" onClick={nextWordPhrase}>Next</Button>
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
                        type="text"
                        placeholder="Re-phrase the sentence here..."
                        defaultValue={wordBank.current[currentIndex].userSentence}
                        onChange={(e) => {
                            wordBank.current[currentIndex].userSentence = e.target.value
                        }}
                        className="w-3/4"
                        disabled={wordBank.current[currentIndex].isResponseReviewed} />

                    {loadingSentence && wordBank.current[currentIndex].isResponseReviewed == false ? 
                        <Spinner className="mt-2" /> : 
                        wordBank.current[currentIndex].isResponseReviewed || wordBank.current[currentIndex].userGrammarMistakes.length > 0 ?
                            <Card className="mt-4 bg-neutral-100">
                                <CardHeader className="text-2xl text-center">
                                    <CardTitle className={`${wordBank.current[currentIndex].userGrammarMistakes.length > 0 ? "text-red-600" : "text-primary"}`}>
                                        { wordBank.current[currentIndex].userGrammarMistakes.length > 0 ? 
                                            "Found Grammar/Spelling Mistakes" : 
                                            "Sentence Similarity Result"
                                        }
                                    </CardTitle>
                                    <CardDescription >
                                        
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    { wordBank.current[currentIndex].userGrammarMistakes.length > 0 ? 
                                        <div className="text-color-600">
                                            {wordBank.current[currentIndex].userGrammarMistakes.map((mistakeTypeList: GrammarMistake) => (
                                                <ul className="list-disc pl-6 mb-4">
                                                    <li><b>Type: </b>{mistakeTypeList.mistake_type}
                                                        <ul className="list-disc pl-6">
                                                            {mistakeTypeList.mistake_list.map((mistake: MistakeAndHint) => (
                                                                <li>{mistake.mistake}
                                                                    <ul className="pl-6">
                                                                        <li>-<b>Hint: </b>{mistake.hint}</li>
                                                                    </ul>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </li>
                                                </ul>
                                            ))}
                                        </div> :
                                        <div>
                                            <p className="mt-2"><b>Rephrase Similarity:</b> {wordBank.current[currentIndex].similarity}%</p>
                                            <p><b>Feedback:</b> {wordBank.current[currentIndex].userResult}</p>
                                        </div>
                                    }
                                    
                                </CardContent>
                            </Card> :
                            <Button className="bg-teal-600 hover:bg-teal-500 mt-4" onClick={reviewUserResponse}>Review with AI</Button>
                    }

                </div>}
            </div>
        </div>
    )
}

export default RewritePhrases