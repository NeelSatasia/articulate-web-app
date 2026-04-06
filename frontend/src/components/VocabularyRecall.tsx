import { Navigate } from "react-router-dom"
import api from "../api"
import { isAuth, loadingStr, setAuthInLocalStorage, trueStr, type VocabularyWord } from "../commons"
import { useEffect, useState } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface RecallWordInfo {
    basicInfo: VocabularyWord
    generatedSentence: string
    options: string[]
    selectedOption: string | null
    status: "unanswered" | "incorrect" | "correct"
}

const VocabularyRecall = () => {
    const [allVocabularyWords, setAllVocabularyWords] = useState<VocabularyWord[]>([])
    const [remainingWords, setRemainingWords] = useState<VocabularyWord[]>([])
    const [quizItems, setQuizItems] = useState<RecallWordInfo[]>([])
    const [currentIdx, setCurrentIdx] = useState<number>(-1)

    const [loading, setLoading] = useState<boolean>(true)
    const [loadingSentence, setLoadingSentence] = useState(false)

    useEffect(() => {
        const getUserVocabulary = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/vocabulary")
                    
                    localStorage.setItem(isAuth, trueStr)
                    setAllVocabularyWords(resp.data)
                    setRemainingWords(resp.data)
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

    const shuffleWords = (words: string[]) => {
        const copiedWords = [...words]
        for (let i = copiedWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[copiedWords[i], copiedWords[j]] = [copiedWords[j], copiedWords[i]]
        }
        return copiedWords
    }

    const buildOptions = (correctWord: string) => {
        const distractors = shuffleWords(
            allVocabularyWords
                .map((word) => word.word)
                .filter((word) => word !== correctWord)
        ).slice(0, 3)

        return shuffleWords([correctWord, ...distractors])
    }

    const nextWord = async () => {
        if (currentIdx + 1 < quizItems.length) {
            setCurrentIdx((prev) => prev + 1)
            return
        }

        if (remainingWords.length === 0) {
            return
        }

        const randomIndex = Math.floor(Math.random() * remainingWords.length)
        const selectedWord = remainingWords[randomIndex]

        try {
            setLoadingSentence(true)
            const resp = await api.get("/ai/generate-sentence-for-word/" + selectedWord.word)

            setQuizItems((prev) => [
                ...prev,
                {
                    basicInfo: selectedWord,
                    generatedSentence: resp.data["sentence"],
                    options: buildOptions(selectedWord.word),
                    selectedOption: null,
                    status: "unanswered",
                },
            ])

            setRemainingWords((prev) => prev.filter((_, idx) => idx !== randomIndex))
            setCurrentIdx((prev) => prev + 1)
        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Error fetching generated sentence", error)
        } finally {
            setLoadingSentence(false)
        }
    }

    const prevWord = () => {
        setCurrentIdx((prev) => prev - 1)
    }

    const chooseOption = (option: string) => {
        if (currentIdx < 0 || currentIdx >= quizItems.length) {
            return
        }

        setQuizItems((prev) =>
            prev.map((item, idx) => {
                if (idx !== currentIdx || item.status === "correct") {
                    return item
                }

                const isCorrect = option === item.basicInfo.word
                return {
                    ...item,
                    selectedOption: option,
                    status: isCorrect ? "correct" : "incorrect",
                }
            })
        )
    }

    const currentItem = currentIdx >= 0 ? quizItems[currentIdx] : null
    const answeredCorrectCount = quizItems.filter((item) => item.status === "correct").length
    const progressPercent = allVocabularyWords.length === 0
        ? 0
        : Math.round((answeredCorrectCount / allVocabularyWords.length) * 100)

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to={"/"} replace />
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    return (
        <div className="flex flex-col gap-y-6 p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Vocabulary Recall Practice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>Progress: {answeredCorrectCount}/{allVocabularyWords.length} mastered</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded bg-secondary">
                        <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-row gap-x-3">
                <Button variant="outline" onClick={prevWord} disabled={currentIdx <= 0 || loadingSentence}>Back</Button>
                <Button onClick={nextWord} disabled={loadingSentence || (currentIdx + 1 >= quizItems.length && remainingWords.length === 0)}>
                    {currentIdx === -1 ? "Start" : "Next"}
                </Button>
            </div>

            {currentIdx === -1 && loadingSentence && <Spinner />}

            {currentIdx === -1 && !loadingSentence && (
                <p className="text-sm italic text-muted-foreground">
                    {allVocabularyWords.length === 0
                        ? "Your vocabulary collection is currently empty!"
                        : "Click start to begin."}
                </p>
            )}

            {currentItem && loadingSentence && <Spinner />}

            {currentItem && !loadingSentence && (
                <Card>
                    <CardHeader>
                        <CardTitle>Question {currentIdx + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="rounded-md border bg-muted/30 px-4 py-3 text-base leading-relaxed">
                            {currentItem.generatedSentence}
                        </p>

                        <div className="grid gap-2">
                            {currentItem.options.map((option) => {
                                const isSelected = currentItem.selectedOption === option
                                const isCorrectOption = currentItem.basicInfo.word === option

                                let optionClasses = "justify-start h-auto whitespace-normal text-left"

                                if (currentItem.status === "correct" && isCorrectOption) {
                                    optionClasses += " bg-emerald-600 text-white hover:bg-emerald-600"
                                } else if (currentItem.status === "incorrect" && isSelected) {
                                    optionClasses += " bg-destructive text-destructive-foreground hover:bg-destructive"
                                } else if (currentItem.status === "incorrect" && isCorrectOption) {
                                    optionClasses += " border-emerald-500"
                                }

                                return (
                                    <Button
                                        key={`option-${option}`}
                                        variant="outline"
                                        className={optionClasses}
                                        onClick={() => chooseOption(option)}
                                        disabled={currentItem.status === "correct"}
                                    >
                                        {option}
                                    </Button>
                                )
                            })}
                        </div>

                        {currentItem.status === "incorrect" && (
                            <p className="text-sm text-destructive">
                                Not quite. Try again, or use the highlighted correct option.
                            </p>
                        )}

                        {currentItem.status === "correct" && (
                            <div className="space-y-1 rounded-md border border-emerald-500/40 bg-emerald-50 p-3 text-sm">
                                <p className="font-semibold text-emerald-700">Correct: {currentItem.basicInfo.word}</p>
                                <p className="text-emerald-900">Definition: {currentItem.basicInfo.definition}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

        </div>
    )
}

export default VocabularyRecall