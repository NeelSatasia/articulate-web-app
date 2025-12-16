import { useEffect, useState, useRef } from 'react'
import api from '../api'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import "/src/WordBank.css"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'

interface Category {
    word_category_id: number
    word_category: string
}

interface WordPhrase {
    word_id: number
    word_category_id: number
    word_phrase: string
}

const WordBank = () => {

    const [manualRendersCount, setManualRendersCount] = useState<number>(0)

    const categories = useRef<Map<number, string>>(new Map())
    const wordBank = useRef<Map<number, Map<number, string>>>(new Map())
    
    const newWordPhrases = useRef<Map<number, string[]>>(new Map())
    const existingWordPhrases = useRef<Map<number, Map<number, string>>>(new Map())
    const deleteExistingWordPhrases = useRef<Map<number, Set<number>>>(new Map())

    const [editMode, setEditMode] = useState<boolean>(false)

    const [accordionDefaults, setAccordionDefaults] = useState<string[]>([])


    useEffect(() => {
        const getCategories = async () => {
            try {
                const resp = await api.get('/wordbank/categories')

                resp.data.forEach((row: Category) => {
                    categories.current.set(row.word_category_id, row.word_category)
                })

                const updatedDefaults = Array.from(categories.current).map(
                    ([categoryID, categoryName]) => `${categoryName}-${categoryID}`
                )

                setAccordionDefaults(updatedDefaults)

            } catch (error) {
                console.error("Error fetching categories", error)
            }
        }

        getCategories()
    }, [])

    useEffect(() => {
        const getWordBank = async () => {
            try {
                const resp = await api.get('/wordbank')

                resp.data.forEach((row: WordPhrase) => {
                    
                    if (!wordBank.current.has(row.word_category_id)) {
                        wordBank.current.set(row.word_category_id, new Map<number, string>())
                    }

                    wordBank.current.get(row.word_category_id)!.set(row.word_id, row.word_phrase)
                    
                })

                setManualRendersCount(prev => prev + 1)

            } catch (error) {
                console.error("Error fetching word bank", error)
            }
        }

        getWordBank()
    }, [])

    const addNewWordPhrase = async (categoryID: number) => {

        if (!newWordPhrases.current.has(categoryID)) {
            newWordPhrases.current.set(categoryID, [])
        }

        newWordPhrases.current.get(categoryID)?.push("")

        setManualRendersCount(manualRendersCount + 1)

    }

    const changeNewWordPhrase = (categoryID: number, index: number, newValue: string) => {
        newWordPhrases.current.get(categoryID)![index] = newValue
    }

    const deleteNewWordPhrase = (categoryID: number, index: number) => {
        newWordPhrases.current.get(categoryID)?.splice(index, 1)
        setManualRendersCount(manualRendersCount + 1)
    }

    const modifyDeleteWordPhrases = (categoryID: number, wordID: number, newVal: boolean) => {
        if (newVal) {
            deleteExistingWordPhrases.current.get(categoryID)?.add(wordID) || deleteExistingWordPhrases.current.set(categoryID, new Set<number>([wordID]))
        } else {
            deleteExistingWordPhrases.current.get(categoryID)?.delete(wordID)
        }
    }

    const changeExisitingWordPhrase = (categoryID: number, wordID: number, newValue: string) => {
        if (!existingWordPhrases.current.has(categoryID)) {
            existingWordPhrases.current.set(categoryID, new Map<number, string>())
        }

        existingWordPhrases.current.get(categoryID)?.set(wordID, newValue)
    }

    const changeEditMode = () => {
        if (editMode) {
            
            if (deleteExistingWordPhrases.current.size > 0) {
                deleteExistingWordPhrases.current.forEach((wordIDs: Set<number>, categoryID: number) => {
                    for (const wordID of wordIDs) {
                        wordBank.current.get(categoryID)?.delete(wordID)
                        if (existingWordPhrases.current.has(categoryID)) {
                            existingWordPhrases.current.get(categoryID)?.delete(wordID)
                        }
                    }
                })
            }

            existingWordPhrases.current.forEach((wordPhrases: Map<number, string>, categoryID: number) => {
                wordPhrases.forEach((modifiedWordPhrase: string, wordID: number) => {
                    wordBank.current.get(categoryID)?.set(wordID, modifiedWordPhrase)
                })
            })
            
            if (newWordPhrases.current.size > 0) {
                newWordPhrases.current.forEach((wordPhrases: string[], categoryID: number) => {
                    //TODO
                })
            }


        }
        setEditMode(!editMode)
    }

    const cancelChanges = () => {
        existingWordPhrases.current.clear()
        newWordPhrases.current.clear()
        deleteExistingWordPhrases.current.clear()

        setEditMode(false)
    }
    

    return (
        
        <div>
            
            <div className="mb-4">
                <Button key="edit-wordbank" className="mr-2" onClick={changeEditMode}>
                    {editMode ? "Save changes": "Edit"}
                </Button>
                
                {editMode && <Button key="cancel-changes" className="bg-red-600 hover:bg-red-500 mr-4" onClick={cancelChanges}>Cancel</Button>}
                {editMode && <Button key="add-category" className="bg-green-600 hover:bg-green-500">Add Category</Button>}

            </div>

            <Accordion type="multiple" value={accordionDefaults} onValueChange={(v) => setAccordionDefaults(v)} >
                {Array.from(categories.current).map(([categoryID, categoryName]) => (
                    <AccordionItem key={"item-" + categoryID.toString()} className="border-0 border-black mb-4" value={categoryName + "-" + categoryID.toString()}>
                        <AccordionTrigger key={"category-" + categoryID.toString()} className="text-2xl bg-primary rounded-t-lg p-2 text-primary-foreground">{categoryName}</AccordionTrigger>
                        <AccordionContent key={"category-content-" + categoryID.toString()} className="p-2 bg-secondary rounded-b-lg">
                            <Table key={"table-" + categoryID.toString()}>
                                <TableBody key={"tablebody-" + categoryID.toString()}>
                                    {Array.from(wordBank.current.get(categoryID) ?? []).map(([wordID, wordPhrase]) => (
                                        <TableRow key={"existing-row-" + wordID.toString()} className="border-b border-neutral-400">
                                            <TableCell key={"existing-cell-1-" + wordID.toString()}>
                                                {editMode ? <span id={"existing-span-" + wordID.toString()} className="flex gap-2 items-center"> 
                                                    <Checkbox id={"existing-cb-" + categoryID.toString() + wordID.toString()} className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" onCheckedChange={(val) => modifyDeleteWordPhrases(categoryID, wordID, Boolean(val))}/>
                                                    <Input id={"existing-input-" + categoryID.toString() + wordID.toString()} defaultValue={wordPhrase} onChange={(e) => changeExisitingWordPhrase(categoryID, wordID, e.target.value)}/> </span> : wordPhrase
                                                }
                                                
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {Array.from(newWordPhrases.current.get(categoryID) || []).map((newWordPhrase, index) => (
                                        <TableRow key={"new-row-" + index.toString()} className="border-b border-neutral-400">
                                            <TableCell key={"new-cell-1-" + index.toString()}>
                                                <span id={"new-span-" + index.toString()} className="flex gap-2 items-center">
                                                    <Button key={"new-del-" + categoryID.toString() + index.toString()} className="bg-red-600 hover:bg-red-500" onClick={() => deleteNewWordPhrase(categoryID, index)}>Delete</Button>
                                                    <Input id={"new-input-" + categoryID.toString() + index.toString()} placeholder="Enter word/phrase here... " defaultValue={newWordPhrase} onChange={e => changeNewWordPhrase(categoryID, index, e.target.value)}/> 
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {editMode && <Button key={"add-new-" + categoryID.toString()} className="w-full bg-green-700 hover:bg-green-600" onClick={() => addNewWordPhrase(categoryID)}>Add</Button>}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

export default WordBank