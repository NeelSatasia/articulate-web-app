import { useEffect, useState } from 'react'
import api from '../api'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import "/src/WordBank.css"

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

    return (
        
        <div>
            <Accordion type="multiple" >
                {Array.from(categories).map(([categoryID, categoryName]) => (
                    <div key={"category-content-" + categoryName} className='category-content'>
                        <AccordionItem key={categoryID} value={categoryName + "-" + categoryID.toString()}>
                            <AccordionTrigger>{categoryName}</AccordionTrigger>
                                <AccordionContent className="flex flex-col gap-4 text-balance">
                                    <Table>
                                        <TableBody>
                                            {Array.from(wordBank.get(categoryID) ?? []).map(([wordID, wordPhrase]) => (
                                                <TableRow key={wordID.toString()}>
                                                    <TableCell>{wordPhrase}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                        </AccordionItem>
                    </div>
                ))}
            </Accordion>
        </div>
    )
}

export default WordBank