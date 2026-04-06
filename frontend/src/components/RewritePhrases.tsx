import { falseStr, isAuth, setAuthInLocalStorage, trueStr, type GrammarCheckResponse, type GrammarMistakeGroup, type MistakeAndHint, type WordPhrase } from "../commons"
import api from "../api"
import { useEffect, useRef, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Navigate } from "react-router-dom"
import { Label } from "./ui/label"

interface WordPhraseResponse {
    phraseID: number
    phrase: string
    generatedSentence: string
    userSentence: string
    isSentenceGenerated: boolean
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
    const [_, setRefresh] = useState<number>(-1)

    useEffect(() => {
        const getWordBank = async () => {
            try {
                const resp = await api.get("/wordbank")

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
            const resp = await api.get("/ai/generate-sentence/" + wordBank.current[currentIndex].phraseID)
            
            if (resp.data.sentence) {
                wordBank.current[currentIndex].generatedSentence = resp.data.sentence
                wordBank.current[currentIndex].isSentenceGenerated = true
            }
            
            setLoadingSentence(false)

        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Error generating sentence", error)
        }
    }

    const reviewUserResponse = async () => {

        if (wordBank.current[currentIndex].userSentence.trim().length === 0 || !wordBank.current[currentIndex].userSentence.trim().toLowerCase().includes(wordBank.current[currentIndex].phrase.toLowerCase())) {
            wordBank.current[currentIndex].isFoundMistakes = true
            setRefresh(prev => -1 * prev)
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

                    const similarityResp = await api.get("/ai/review-user-response/" + wordBank.current[currentIndex].userSentence + "/" + wordBank.current[currentIndex].generatedSentence)

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
                setAuthInLocalStorage(error)
                console.error("Error reviewing user sentence", error)
            } finally {
                setLoadingSentence(false)
            }
        }
    }

    const changeUserAnswer = (newValue: string) => {
        if (currentIndex >= 0) {
            wordBank.current[currentIndex].userSentence = newValue
            setRefresh(prev => -1 * prev)
        }
    }

    const currentWord = wordBank.current[currentIndex]
    const hasWords = wordBank.current.length > 0

    if (loading) {
        return <Loading spinnerAction="Loading"/>
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to={"/"} replace/>
    }

    return (
        <div className="flex w-full flex-col gap-6 p-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-2xl">Rewrite Phrases Practice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>Phrase {hasWords ? currentIndex + 1 : 0} of {wordBank.current.length}</span>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={prevWordPhrase} disabled={currentIndex === 0}>Back</Button>
                        <Button onClick={nextWordPhrase} disabled={currentIndex >= wordBank.current.length - 1}>Next</Button>
                    </div>
                </CardContent>
            </Card>

            {hasWords ? 
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Phrase: <span className="font-normal">{currentWord.phrase}</span></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!currentWord.isSentenceGenerated && (
                        <Button className="bg-teal-600 hover:bg-teal-500" onClick={generateSentence} disabled={currentWord.isSentenceGenerated}>
                            Generate Sentence
                        </Button>
                    )}

                    {loadingSentence && !currentWord.isSentenceGenerated ? (
                        <Spinner />
                    ) : (
                        currentWord.isSentenceGenerated && (
                            <div className="rounded-md border bg-muted/40 p-4">
                                <p className="text-sm font-semibold">Generated Sentence</p>
                                <p className="mt-1">{currentWord.generatedSentence}</p>
                            </div>
                        )
                    )}

                    {currentWord.isSentenceGenerated && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="rewrite-input">Your Rewrite</Label>
                                <Textarea
                                    id="rewrite-input"
                                    key="user-sentence-input"
                                    placeholder="Rewrite the sentence naturally using the phrase..."
                                    value={currentWord.userSentence}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 255) {
                                            changeUserAnswer(e.target.value)
                                        }
                                    }}
                                    rows={4}
                                    className="mt-2"
                                    disabled={currentWord.userGrammarMistakes.grammar_check.length == 0 && currentWord.similarity >= 70.0}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">Max 255 characters</p>
                            </div>

                            {loadingSentence ? (
                                <Spinner className="mt-2" />
                            ) : currentWord.isResponseReviewed || currentWord.isFoundMistakes ? (
                                <Card className="bg-neutral-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className={`${currentWord.isFoundMistakes ? "text-red-600" : "text-primary"} text-nowrap`}>
                                            {currentWord.isFoundMistakes ? "Mistakes/Errors Found" : "Result"}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {currentWord.isFoundMistakes ? (
                                            <div className="text-red-700">
                                                {currentWord.userSentence.trim().length === 0 && <p>Empty response</p>}

                                                {!currentWord.userSentence.toLowerCase().includes(currentWord.phrase.toLowerCase()) && (
                                                    <p>Incomplete usage of the given word-phrase in the sentence</p>
                                                )}

                                                {currentWord.userGrammarMistakes.grammar_check.map((mistakeTypeList: GrammarMistakeGroup, idx: number) => (
                                                    <div key={`mistake-group-${idx}`} className="mt-3 rounded-lg bg-red-100 p-2">
                                                        <div className="mb-2"><b className="text-lg">{mistakeTypeList.mistake_type}</b></div>
                                                        <ol type="1" className="list-decimal pl-10">
                                                            {mistakeTypeList.mistakes.map((mistake: MistakeAndHint, mistakeIdx: number) => (
                                                                <li key={`mistake-${idx}-${mistakeIdx}`} className="mt-2">
                                                                    {mistake.mistake}
                                                                    <ul className="pl-6">
                                                                        <li>- <b>Hint: </b>{mistake.hint}</li>
                                                                    </ul>
                                                                </li>
                                                            ))}
                                                        </ol>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p><b>Similarity:</b> {currentWord.similarity}%</p>
                                                <p><b>Feedback:</b> {currentWord.userResult}</p>
                                            </div>
                                        )}
                                    </CardContent>

                                    {(currentWord.userGrammarMistakes.grammar_check.length > 0 || currentWord.similarity < 70.0) && (
                                        <CardFooter className="justify-center">
                                            <div className="text-center">
                                                <p className="text-xs text-neutral-400">Change your response first, then click Try Again</p>
                                                <Button className="mt-2 bg-teal-600 hover:bg-teal-500" onClick={reviewUserResponse}>Try Again</Button>
                                            </div>
                                        </CardFooter>
                                    )}
                                </Card>
                            ) : (
                                <Button className="bg-teal-600 hover:bg-teal-500" onClick={reviewUserResponse}>Review with AI</Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            : <Label className="italic text-neutral-500">Your commonplace book is currently empty!</Label>}
        </div>
    )
}

export default RewritePhrases