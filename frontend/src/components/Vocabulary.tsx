import api from "@/api"
import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import Loading from "./Loading"
import { falseStr, isAuth, setAuthInLocalStorage, trueStr, type VocabularyWord } from "../commons"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Spinner } from "./ui/spinner"
import { Checkbox } from "./ui/checkbox"
import { Card, CardContent } from "./ui/card"

const Vocabulary = () => {

    const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [newWord, setNewWord] = useState<string>("")
    const [addWordLoading, setAddWordLoading] = useState<boolean>(false)
    const [delWordsLoading, setDelWordsLoading] = useState<boolean>(false)
    const [newVocabWords, setNewVocabWords] = useState<Set<string>>(new Set())
    const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set())
    const [expandedWordId, setExpandedWordId] = useState<number | null>(null)

    useEffect(() => {
        const fetchVocabulary = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get("/vocabulary")
                    
                    localStorage.setItem(isAuth, trueStr)
                    setVocabulary(resp.data)
                }
            } catch (error) {
                setAuthInLocalStorage(error)
                console.error("Error fetching vocabulary", error)
            } finally {
                setLoading(false)
            }
        }

        fetchVocabulary()
    }, [])

    const addNewVocabularyWordToList = () => {

        if (newWord.length === 0) {
            return
        }

        for (const vWord of vocabulary) {
            if (vWord.word === newWord) {
                return
            }
        }

        setNewVocabWords(prev => {
            const updated = new Set(prev)
            updated.add(newWord)
            return updated
        })
    }

    const addNewVocabularyWords = async () => {

        if (newVocabWords.size > 0) {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    setAddWordLoading(true)
                    const resp = await api.post<VocabularyWord[]>("/ai/vocabulary", {words: Array.from(newVocabWords)})
                    
                    localStorage.setItem(isAuth, trueStr)
                    
                    setVocabulary(prev => [...prev, ...resp.data])
                    setNewVocabWords(new Set())
                    setNewWord("")
                }
            } catch (error) {
                setAuthInLocalStorage(error)
                console.error("Error adding new vocabulary words", error)
            } finally {
                setAddWordLoading(false)
            }
        }
    }

    const deleteWords = async () => {

        if (selectedWordIds.size === 0) {
            return
        }

        try {
            setDelWordsLoading(true)

            await api.delete('/vocabulary', { data: Array.from(selectedWordIds) })

            const updated = []

            for (const vocabWord of vocabulary) {
                if (!selectedWordIds.has(vocabWord.word_id)) {
                    updated.push(vocabWord)
                }
            }

            setSelectedWordIds(new Set())
            setVocabulary(updated)
        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Error deleting vocabulary word", error)
        } finally {
            setDelWordsLoading(false)
        }
    }

    const deleteNewWord = (newWordToDelete: string) => {
        setNewVocabWords(prev => {
            const updated = new Set(prev)
            updated.delete(newWordToDelete)
            return updated
        })
    }

    const toggleWordSelection = (wordId: number, checked: boolean) => {
        setSelectedWordIds(prev => {
            const updated = new Set(prev)
            if (checked) {
                updated.add(wordId)
            } else {
                updated.delete(wordId)
            }
            return updated
        })
    }

    const toggleExpandedCard = (wordId: number) => {
        setExpandedWordId(prev => (prev === wordId ? null : wordId))
    }

    if (loading) {
        return <Loading spinnerAction="Loading"/>
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="flex flex-col p-4 gap-y-4">
            <h1 className="text-2xl mb-4">Your Vocabulary Collection</h1>

            <div className="flex gap-x-2">
                {addWordLoading ? <Spinner /> : <Button key="add-new-vocabulary-word" onClick={addNewVocabularyWordToList} disabled={delWordsLoading || newVocabWords.size >= 10} >Add</Button>}

                <Input 
                    id="new-vocabulary-word-input" 
                    placeholder="Enter a new word here" 
                    type="text" value={newWord} 
                    onChange={(e) => {
                        if (!e.target.value.includes(' ') && !/\d/.test(e.target.value) && !/[^a-zA-Z0-9]/.test(e.target.value)) {
                            setNewWord(e.target.value)
                        }
                    }} />

                
            </div>

            {newVocabWords.size > 0 && 
            <div className="flex">
                {Array.from(newVocabWords).map(word => (
                    <Button key={word} size="sm" className="mr-2 bg-white hover:bg-white text-color-primary hover:line-through border border-black hover:text-red-500 hover:border-red-500" onClick={() => deleteNewWord(word)}>{word}</Button>
                ))}
            </div>}

            {newVocabWords.size > 0 && <Button key="get-definitions-btn" className="w-fit bg-teal-600 hover:bg-teal-500" onClick={addNewVocabularyWords}>Get Info</Button>}

            {vocabulary.length === 0 ? (
                <div className="w-full h-full justify-center items-center">You have no vocabulary words yet.</div>
            ) :
                <div className="w-full">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Click a card to reveal definition, example, and level.</p>
                        {delWordsLoading ? (
                            <Spinner />
                        ) : (
                            <Button
                                key="delete-selected-words"
                                className="bg-red-700 hover:bg-red-600"
                                size="sm"
                                onClick={deleteWords}
                                disabled={addWordLoading || selectedWordIds.size === 0}
                            >
                                Delete Selected ({selectedWordIds.size})
                            </Button>
                        )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {vocabulary.map(vocabWord => {
                            const isExpanded = expandedWordId === vocabWord.word_id
                            const isSelected = selectedWordIds.has(vocabWord.word_id)

                            return (
                                <Card
                                    key={"vocabulary-card-" + vocabWord.word_id}
                                    className={`cursor-pointer transition-all ${isSelected ? "border-red-300" : ""}`}
                                    onClick={() => toggleExpandedCard(vocabWord.word_id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-semibold">{vocabWord.word}</p>
                                                <p className="text-xs text-muted-foreground">{isExpanded ? "Click to collapse" : "Click to reveal details"}</p>
                                            </div>

                                            <div
                                                className="flex items-center gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="text-xs text-muted-foreground">Select</span>
                                                <Checkbox
                                                    key={"delete-word-option" + vocabWord.word_id}
                                                    className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                    checked={isSelected}
                                                    onCheckedChange={(val) => toggleWordSelection(vocabWord.word_id, Boolean(val))}
                                                    disabled={addWordLoading || delWordsLoading}
                                                />
                                            </div>
                                        </div>

                                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] mt-4" : "grid-rows-[0fr]"}`}>
                                            <div className="overflow-hidden">
                                                <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
                                                    <p><b>Definition:</b> {vocabWord.definition}</p>
                                                    <p><b>Example:</b> {vocabWord.example || "No example available yet."}</p>
                                                    <p><b>Level:</b> {vocabWord.word_level}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            }
        </div>
    )
}

export default Vocabulary