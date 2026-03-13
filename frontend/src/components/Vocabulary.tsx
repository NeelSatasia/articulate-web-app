import api from "@/api"
import { useEffect, useRef, useState } from "react"
import { Navigate } from "react-router-dom"
import Loading from "./Loading"
import { falseStr, isAuth, setAuthInLocalStorage, trueStr, type VocabularyWord } from "../commons"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Spinner } from "./ui/spinner"
import { Checkbox } from "./ui/checkbox"

const Vocabulary = () => {

    const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [newWord, setNewWord] = useState<string>("")
    const [addWordLoading, setAddWordLoading] = useState<boolean>(false)
    const [delWordsLoading, setDelWordsLoading] = useState<boolean>(false)
    const [newVocabWords, setNewVocabWords] = useState<Set<string>>(new Set())
    const toBeDeleted = useRef<Set<number>>(new Set())

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

        if (toBeDeleted.current.size == 0) {
            return
        }

        try {
            setDelWordsLoading(true)

            await api.delete('/vocabulary', { data: Array.from(toBeDeleted.current) })

            const updated = []

            for (const vocabWord of vocabulary) {
                if (!toBeDeleted.current.has(vocabWord.word_id)) {
                    updated.push(vocabWord)
                }
            }

            toBeDeleted.current.clear()
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

    if (loading) {
        return <Loading spinnerAction="Loading"/>
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="flex flex-col p-4 gap-y-4">
            <h1 className="text-3xl mb-4">Your Vocabulary</h1>

            <div className="flex gap-x-2">
                {addWordLoading ? <Spinner /> : <Button key="add-new-vocabulary-word" onClick={addNewVocabularyWordToList} disabled={delWordsLoading} >Add</Button>}

                <Input 
                    id="new-vocabulary-word-input" 
                    placeholder="Type a new word here" 
                    type="text" value={newWord} 
                    onChange={(e) => {
                        if (!e.target.value.includes(' ') && !/\d/.test(e.target.value) && !/[^a-zA-Z0-9]/.test(e.target.value)) {
                            setNewWord(e.target.value)
                        }
                    }} />

                
            </div>

            {newVocabWords.size > 0 && 
            <div className="flex justify-center">
                {Array.from(newVocabWords).map(word => (
                    <Button key={word} size="sm" className="mr-2 bg-white hover:bg-white text-color-primary hover:line-through border border-black" onClick={() => deleteNewWord(word)}>{word}</Button>
                ))}
            </div>}

            {newVocabWords.size > 0 && <Button key="get-definitions-btn" onClick={addNewVocabularyWords}>Get Definitions</Button>}

            {vocabulary.length === 0 ? (
                <div className="w-full h-full justify-center items-center">You have no vocabulary words yet.</div>
            ) :
                <div className="w-full p-2 outline outline-offset outline-primary rounded">
                    <Table key="user-vocabulary" className="rounded bg-neutral-100 rounded">
                        <TableHeader className="rounded-md">
                            <TableRow className="bg-neutral-300 hover:bg-neutral-300 rounded">
                                <TableHead className="w-1/4">Word</TableHead>
                                <TableHead className="w-2/4">Definition</TableHead>
                                <TableHead>
                                    {delWordsLoading ? <Spinner /> : <Button key="delete-selected-words" className="bg-red-700 hover:bg-red-600" size="sm" onClick={deleteWords} disabled={addWordLoading}>Delete</Button>}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody key="vocabulary-content">
                            {vocabulary.map(vocabWord => (
                                <TableRow key={"vocabulary-row-" + vocabWord.word_id} className="hover:bg-primary hover:text-secondary rounded">
                                    <TableCell key={"vocabulary-" + vocabWord.word_id} className="rounded-l-md">
                                        {vocabWord.word}
                                    </TableCell>
                                    <TableCell key={"vocabulary-definition-" + vocabWord.word_id} >
                                        {vocabWord.definition}
                                    </TableCell>
                                    <TableCell className="rounded-r-md">
                                        <Checkbox key={"delete-word-option" + vocabWord.word_id} className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" onCheckedChange={(val) => {if (Boolean(val)) {toBeDeleted.current.add(vocabWord.word_id)} else {toBeDeleted.current.delete(vocabWord.word_id)}} } disabled={addWordLoading || delWordsLoading} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            }
        </div>
    )
}

export default Vocabulary