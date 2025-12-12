import { useEffect, useState } from 'react'
import api from '../api'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import "/src/WordBank.css"
import { Button } from './ui/button'

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
    

    return (
        
        <div>
            <Button className="bg-orange-600 hover:bg-orange-500 mb-4">Edit</Button>

            <Accordion type="multiple" value={accordionDefaults} onValueChange={(v) => setAccordionDefaults(v)} >
                {Array.from(categories).map(([categoryID, categoryName]) => (
                    <AccordionItem className="border-0 border-black mb-4" key={categoryID} value={categoryName + "-" + categoryID.toString()}>
                        <AccordionTrigger className="text-2xl bg-primary rounded-t-lg p-2 text-primary-foreground">{categoryName}</AccordionTrigger>
                        <AccordionContent className="p-2 bg-secondary rounded-b-lg">
                            <Table>
                                <TableBody>
                                    {Array.from(wordBank.get(categoryID) ?? []).map(([wordID, wordPhrase]) => (
                                        <TableRow key={wordID.toString()} className="border-b border-neutral-400">
                                            <TableCell>{wordPhrase}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

export default WordBank