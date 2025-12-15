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

    const [categories, setCategories] = useState<Map<number, string>>(new Map())
    const [wordBank, setWordBank] = useState<Map<number, Map<number, string>>>(new Map())
    
    const [countNewInputs, setCountNewInputs] = useState<Map<number, number>>(new Map())
    const newWordPhrases = useRef<Map<number, HTMLInputElement[]>>(new Map())
    const [editMode, setEditMode] = useState<boolean>(false)

    let uniqID = -1

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
                    
                    uniqID = row.word_id + 1
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
        setCountNewInputs(prev => {
            const newMap = new Map(prev);
            newMap.set(categoryID, (newMap.get(categoryID) ?? 0) + 1);
            return newMap;
        })

    }

    const registerInputRef = (categoryID: number, index: number, el: HTMLInputElement | null) => {
        if (!el) return

        const arr = newWordPhrases.current.get(categoryID) || [];
        arr[index] = el
        newWordPhrases.current.set(categoryID, arr)
    }

    const changeEditMode = () => {
        if (editMode) {
            const result = new Map<number, string[]>()

            newWordPhrases.current.forEach((inputs, categoryID) => {
                result.set(categoryID, inputs.map(input => input.value))
            })

            console.log(result)

            newWordPhrases.current.clear()
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
                                                    <Input id={"existing-input-" + categoryID.toString() + wordID.toString()} defaultValue={wordPhrase}/> </span> : wordPhrase
                                                }
                                                
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {Array.from({ length: countNewInputs.get(categoryID) ?? 0 }).map((_, index) => (
                                        <TableRow key={"new-row-" + index.toString()} className="border-b border-neutral-400">
                                            <TableCell key={"new-cell-1-" + index.toString()}>
                                                <span id={"new-span-" + index.toString()} className="flex gap-2 items-center"> 
                                                    <Checkbox id={"new-cb-" + categoryID.toString() + index.toString()} className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"/>
                                                    <Input id={"new-input-" + categoryID.toString() + index.toString()} placeholder="Enter word/phrase here... " ref={e => registerInputRef(categoryID, index, e)}/> 
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