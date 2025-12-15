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

    const [categories, setCategories] = useState<Map<number, string>>(new Map())
    const [wordBank, setWordBank] = useState<Map<number, Map<number, string>>>(new Map())
    
    const newWordPhrases = useRef<Map<number, string[]>>(new Map())
    const existingWordPhrases = useRef<Map<number, Map<Number, string>>>(new Map())

    const [editMode, setEditMode] = useState<boolean>(false)


    useEffect(() => {
        const getCategories = async () => {
            try {
                const resp = await api.get('/wordbank/categories')
                
                const tempMap = new Map<number, string>()

                resp.data.forEach((row: Category) => {
                    tempMap.set(row.word_category_id, row.word_category)
                })

                setCategories(tempMap);
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

                const tempMap = new Map<number, Map<number, string>>()

                resp.data.forEach((row: WordPhrase) => {
                    
                    if (!tempMap.has(row.word_category_id)) {
                        tempMap.set(row.word_category_id, new Map<number, string>())
                    }

                    tempMap.get(row.word_category_id)!.set(row.word_id, row.word_phrase)
                    
                })

                setWordBank(tempMap)
            } catch (error) {
                console.error("Error fetching word bank", error)
            }
        }

        getWordBank()
    }, [])

    const [accordionDefaults, setAccordionDefaults] = useState<string[]>([])

    useEffect(() => {
        if (categories && categories.size > 0) {
            const updatedCategories = Array.from(categories).map(
                ([categoryID, categoryName]) => `${categoryName}-${categoryID}`
            )

            setAccordionDefaults(updatedCategories)
        }
    }, [categories])

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

    const changeExisitingWordPhrase = (categoryID: number, wordID: number, newValue: string) => {
        if (!existingWordPhrases.current.has(categoryID)) {
            existingWordPhrases.current.set(categoryID, new Map<number, string>())
        }

        existingWordPhrases.current.get(categoryID)?.set(wordID, newValue)
    }

    const changeEditMode = () => {
        if (editMode) {
            console.log(existingWordPhrases.current)
            console.log(newWordPhrases.current)
        }
        setEditMode(!editMode)
    }
    

    return (
        
        <div>
            
            <Button key={"edit-wordbank"} className="mb-4" onClick={changeEditMode}>
                {editMode ? "Save changes" : "Edit"}
            </Button>

            <Accordion type="multiple" value={accordionDefaults} onValueChange={(v) => setAccordionDefaults(v)} >
                {Array.from(categories).map(([categoryID, categoryName]) => (
                    <AccordionItem key={"item-" + categoryID.toString()} className="border-0 border-black mb-4" value={categoryName + "-" + categoryID.toString()}>
                        <AccordionTrigger key={"category-" + categoryID.toString()} className="text-2xl bg-primary rounded-t-lg p-2 text-primary-foreground">{categoryName}</AccordionTrigger>
                        <AccordionContent key={"category-content-" + categoryID.toString()} className="p-2 bg-secondary rounded-b-lg">
                            <Table key={"table-" + categoryID.toString()}>
                                <TableBody key={"tablebody-" + categoryID.toString()}>
                                    {Array.from(wordBank.get(categoryID) ?? []).map(([wordID, wordPhrase]) => (
                                        <TableRow key={"existing-row-" + wordID.toString()} className="border-b border-neutral-400">
                                            <TableCell key={"existing-cell-1-" + wordID.toString()}>
                                                {editMode ? <span id={"existing-span-" + wordID.toString()} className="flex gap-2 items-center"> 
                                                    <Checkbox id={"existing-cb-" + categoryID.toString() + wordID.toString()} className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"/>
                                                    <Input id={"existing-input-" + categoryID.toString() + wordID.toString()} defaultValue={wordPhrase} onChange={(e) => changeExisitingWordPhrase(categoryID, wordID, e.target.value)}/> </span> : wordPhrase
                                                }
                                                
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {Array.from(newWordPhrases.current.get(categoryID) || []).map((newWordPhrase, index) => (
                                        <TableRow key={"new-row-" + index.toString()} className="border-b border-neutral-400">
                                            <TableCell key={"new-cell-1-" + index.toString()}>
                                                <span id={"new-span-" + index.toString()} className="flex gap-2 items-center"> 
                                                    <Checkbox id={"new-cb-" + categoryID.toString() + index.toString()} className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"/>
                                                    <Input id={"new-input-" + categoryID.toString() + index.toString()} placeholder="Enter word/phrase here... " defaultValue={newWordPhrase} onChange={e => changeNewWordPhrase(categoryID, index, e.target.value)}/> 
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {editMode && <Button key={"add-new-" + categoryID.toString()} className="w-full bg-green-700" onClick={() => addNewWordPhrase(categoryID)}>Add</Button>}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

export default WordBank