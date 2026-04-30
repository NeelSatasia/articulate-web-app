import { Navigate } from "react-router-dom"
import api from "../api"
import { isAuth, loadingStr, setAuthInLocalStorage, trueStr, type VocabularyWord } from "../commons"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import Loading from "./Loading"
import { Button } from "./ui/button"
import { Spinner } from "./ui/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

interface RecallWordInfo {
    basicInfo: VocabularyWord
    generatedSentence: string
    guess: string[]
    revealedIndexes: number[]
    status: "unanswered" | "incorrect" | "correct"
}

const VocabularyRecall = () => {
    const [allVocabularyWords, setAllVocabularyWords] = useState<VocabularyWord[]>([])
    const [remainingWords, setRemainingWords] = useState<VocabularyWord[]>([])
    const [quizItems, setQuizItems] = useState<RecallWordInfo[]>([])
    const [currentIdx, setCurrentIdx] = useState<number>(-1)
    const [loading, setLoading] = useState<boolean>(true)
    const [loadingSentence, setLoadingSentence] = useState(false)

    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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

    const currentItem = currentIdx >= 0 && currentIdx < quizItems.length ? quizItems[currentIdx] : null
    const answeredCorrectCount = quizItems.filter((item) => item.status === "correct").length
    const progressPercent = allVocabularyWords.length === 0 ? 0 : Math.round((answeredCorrectCount / allVocabularyWords.length) * 100)

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
                    guess: Array.from({ length: selectedWord.word.length }, () => ""),
                    revealedIndexes: [],
                    status: "unanswered",
                },
            ])

            setRemainingWords((prev) => prev.filter((_, idx) => idx !== randomIndex))
            setCurrentIdx((prev) => prev + 1)
            inputRefs.current = []
        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Error fetching generated sentence", error)
        } finally {
            setLoadingSentence(false)
        }
    }

    const prevWord = () => {
        setCurrentIdx((prev) => Math.max(0, prev - 1))
    }

    const getNextEditableIndex = (fromIndex: number) => {
        if (!currentItem) {
            return -1
        }

        for (let i = fromIndex + 1; i < currentItem.guess.length; i++) {
            if (!currentItem.revealedIndexes.includes(i)) {
                return i
            }
        }

        return -1
    }

    const getPreviousEditableIndex = (fromIndex: number) => {
        if (!currentItem) {
            return -1
        }

        for (let i = fromIndex - 1; i >= 0; i--) {
            if (!currentItem.revealedIndexes.includes(i)) {
                return i
            }
        }

        return -1
    }

    const focusLetter = (index: number) => {
        const targetInput = inputRefs.current[index]
        targetInput?.focus()
        targetInput?.select()
    }

    const updateGuessLetter = (index: number, value: string) => {
        if (!currentItem || currentItem.status === "correct") {
            return
        }

        const normalizedValue = value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 1)

        setQuizItems((prev) =>
            prev.map((item, idx) => {
                if (idx !== currentIdx) {
                    return item
                }

                const nextGuess = [...item.guess]
                nextGuess[index] = normalizedValue

                return {
                    ...item,
                    guess: nextGuess,
                    status: "unanswered",
                }
            })
        )

        const nextEditableIndex = getNextEditableIndex(index)
        if (nextEditableIndex >= 0) {
            focusLetter(nextEditableIndex)
        }
    }

    const handleLetterKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (!currentItem || currentItem.status === "correct") {
            return
        }

        if (event.key === "Backspace") {
            event.preventDefault()

            const hasValue = currentItem.guess[index].trim().length > 0
            const previousEditableIndex = getPreviousEditableIndex(index)

            setQuizItems((prev) =>
                prev.map((item, idx) => {
                    if (idx !== currentIdx) {
                        return item
                    }

                    const nextGuess = [...item.guess]

                    if (hasValue) {
                        nextGuess[index] = ""
                    } else if (previousEditableIndex >= 0) {
                        nextGuess[previousEditableIndex] = ""
                    }

                    return {
                        ...item,
                        guess: nextGuess,
                        status: "unanswered",
                    }
                })
            )

            if (previousEditableIndex >= 0) {
                focusLetter(previousEditableIndex)
            }

            return
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault()
            const previousEditableIndex = getPreviousEditableIndex(index)
            if (previousEditableIndex >= 0) {
                focusLetter(previousEditableIndex)
            }
            return
        }

        if (event.key === "ArrowRight") {
            event.preventDefault()
            const nextEditableIndex = getNextEditableIndex(index)
            if (nextEditableIndex >= 0) {
                focusLetter(nextEditableIndex)
            }
        }
    }

    const requestHint = () => {
        if (!currentItem || currentItem.status === "correct") {
            return
        }

        const availableIndexes = currentItem.guess
            .map((_, index) => (!currentItem.revealedIndexes.includes(index) ? index : -1))
            .filter((index) => index >= 0)

        if (availableIndexes.length === 0) {
            return
        }

        const shuffledIndexes = shuffleWords(availableIndexes.map(String)).map(Number)
        const hintCount = Math.min(2, shuffledIndexes.length)

        setQuizItems((prev) =>
            prev.map((item, idx) => {
                if (idx !== currentIdx) {
                    return item
                }

                const nextGuess = [...item.guess]
                const nextRevealedIndexes = [...item.revealedIndexes]

                for (let i = 0; i < hintCount; i++) {
                    const letterIndex = shuffledIndexes[i]
                    nextGuess[letterIndex] = item.basicInfo.word[letterIndex].toLowerCase()
                    if (!nextRevealedIndexes.includes(letterIndex)) {
                        nextRevealedIndexes.push(letterIndex)
                    }
                }

                nextRevealedIndexes.sort((a, b) => a - b)

                return {
                    ...item,
                    guess: nextGuess,
                    revealedIndexes: nextRevealedIndexes,
                    status: "unanswered",
                }
            })
        )
    }

    const checkAnswer = () => {
        if (!currentItem || currentItem.status === "correct") {
            return
        }

        setQuizItems((prev) =>
            prev.map((item, idx) => {
                if (idx !== currentIdx) {
                    return item
                }

                const attempt = item.guess.join("").toLowerCase()
                const isCorrect = attempt === item.basicInfo.word.toLowerCase()

                return {
                    ...item,
                    status: isCorrect ? "correct" : "incorrect",
                }
            })
        )
    }

    if (localStorage.getItem(isAuth) !== trueStr) {
        return <Navigate to="/" replace />
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr} />
    }

    return (
        <div className="flex flex-col gap-y-6 p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Vocabulary Recall Practice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>
                            Progress: {answeredCorrectCount}/{allVocabularyWords.length} mastered
                        </span>
                        <span>{progressPercent}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded bg-secondary">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="flex flex-row gap-x-3">
                        <Button variant="outline" onClick={prevWord} disabled={currentIdx <= 0 || loadingSentence}>
                            Back
                        </Button>
                        <Button onClick={nextWord} disabled={loadingSentence || (currentIdx + 1 >= quizItems.length && remainingWords.length === 0)}>
                            {currentIdx === -1 ? "Start" : "Next"}
                        </Button>
                    </div>

                    {currentIdx === -1 && loadingSentence && <Spinner />}

                    {currentIdx === -1 && !loadingSentence && (
                        <p className="text-sm italic text-muted-foreground">
                            {allVocabularyWords.length === 0 ? "Your vocabulary collection is currently empty!" : "Click start to begin."}
                        </p>
                    )}

                    {currentItem && loadingSentence && <Spinner />}
                </CardContent>
            </Card>

            {currentItem && !loadingSentence && (
                <Card>
                    <CardHeader>
                        <CardTitle>Question {currentIdx + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="rounded-md border bg-muted/30 px-4 py-3 text-base leading-relaxed">
                            {currentItem.generatedSentence}
                        </p>

                        <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm text-muted-foreground">Word length: {currentItem.basicInfo.word.length} letters</div>
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" onClick={requestHint} disabled={currentItem.status === "correct"}>
                                        Hint
                                    </Button>
                                    <Button onClick={checkAnswer} disabled={currentItem.status === "correct"}>
                                        Check Answer
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: currentItem.basicInfo.word.length }).map((_, letterIndex) => {
                                    const isRevealed = currentItem.revealedIndexes.includes(letterIndex)
                                    const letterValue = isRevealed ? currentItem.basicInfo.word[letterIndex] : currentItem.guess[letterIndex] ?? ""

                                    return (
                                        <input
                                            key={`guess-letter-${letterIndex}`}
                                            ref={(element) => {
                                                inputRefs.current[letterIndex] = element
                                            }}
                                            type="text"
                                            inputMode="text"
                                            maxLength={1}
                                            value={letterValue}
                                            disabled={isRevealed || currentItem.status === "correct"}
                                            onChange={(event) => updateGuessLetter(letterIndex, event.target.value)}
                                            onKeyDown={(event) => handleLetterKeyDown(event, letterIndex)}
                                            className="h-12 w-12 rounded-md border border-input bg-background text-center text-lg font-semibold uppercase shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted"
                                            aria-label={`Letter ${letterIndex + 1}`}
                                        />
                                    )
                                })}
                            </div>
                        </div>

                        {currentItem.status === "incorrect" && (
                            <p className="text-sm text-destructive">Not quite. Check the sentence, use a hint, and try again.</p>
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