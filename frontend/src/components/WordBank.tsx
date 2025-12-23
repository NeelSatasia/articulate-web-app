import { useEffect, useState, useRef } from 'react'
import api from '../api'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import "/src/WordBank.css"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { falseStr, initAuthInLocalStorage, isAuth, loadingStr, savingStr, setAuthInLocalStorage, trueStr } from '../commons'
import Loading from './Loading'
import { Navigate } from 'react-router-dom'

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

    const modifyExistingCategories = useRef<Map<number, string>>(new Map())
    const modifyExistingWordPhrases = useRef<Map<number, Map<number, string>>>(new Map())

    const deleteExistingCategories = useRef<Set<number>>(new Set())
    const deleteExistingWordPhrases = useRef<Map<number, Set<number>>>(new Map())

    const [editMode, setEditMode] = useState<boolean>(false)
    const [addNewCategoryMode, setAddNewCategoryMode] = useState<boolean>(false)

    const newCategory = useRef<string>("")
    const newCategoryKey = useRef<number>(-1)
    const keysOfNewCategories = useRef<Map<string, number>>(new Map())

    const [accordionDefaults, setAccordionDefaults] = useState<string[]>([])

    const [loading, setLoading] = useState<boolean>(true)
    const [saving, setSaving] = useState<boolean>(false)

    initAuthInLocalStorage()

    const updateAccordionDefaults = () => {
        const updatedDefaults = Array.from(categories.current).map(
            ([categoryID, categoryName]) => `${categoryName}-${categoryID}`
        )

        setAccordionDefaults(updatedDefaults)
    }

    useEffect(() => {
        const getCategories = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get('/wordbank/categories')

                    resp.data.forEach((row: Category) => {
                        categories.current.set(row.word_category_id, row.word_category)
                    })

                    localStorage.setItem(isAuth, trueStr)

                    updateAccordionDefaults()
                }

            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error fetching categories", error)
            }
        }

        getCategories()
    }, [])

    useEffect(() => {
        const getWordBank = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get('/wordbank/', {withCredentials: true})

                    resp.data.forEach((row: WordPhrase) => {
                        
                        if (!wordBank.current.has(row.word_category_id)) {
                            wordBank.current.set(row.word_category_id, new Map<number, string>())
                        }

                        wordBank.current.get(row.word_category_id)!.set(row.word_id, row.word_phrase)
                        
                    })

                    localStorage.setItem(isAuth, trueStr)

                    setManualRendersCount(prev => prev + 1)
                }

            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error fetching word bank", error)
            } finally {
                setLoading(false)
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

        if (newWordPhrases.current.get(categoryID)?.length == 0) {
            newWordPhrases.current.delete(categoryID)
        }

        setManualRendersCount(manualRendersCount + 1)
    }

    const modifyDeleteWordPhrases = (categoryID: number, wordID: number, newVal: boolean) => {
        if (newVal) {
            deleteExistingWordPhrases.current.get(categoryID)?.add(wordID) || deleteExistingWordPhrases.current.set(categoryID, new Set<number>([wordID]))
        } else {
            deleteExistingWordPhrases.current.get(categoryID)?.delete(wordID)
        }

        setManualRendersCount(prev => prev + 1)
    }

    const changeExisitingWordPhrase = (categoryID: number, wordID: number, newValue: string) => {
        if (!modifyExistingWordPhrases.current.has(categoryID)) {
            modifyExistingWordPhrases.current.set(categoryID, new Map<number, string>())
        }

        modifyExistingWordPhrases.current.get(categoryID)?.set(wordID, newValue)
    }

    const changeCategoryMode = () => {
        if (addNewCategoryMode) {
            let isCategoryValid = true

            for (const categoryName of categories.current.values()) {
                if (categoryName === newCategory.current) {
                    isCategoryValid = false
                }
            }

            if (isCategoryValid) {
                categories.current.set(newCategoryKey.current, newCategory.current)
                newWordPhrases.current.set(newCategoryKey.current, [])

                keysOfNewCategories.current.set(newCategory.current, newCategoryKey.current)

                newCategoryKey.current -= 1
                newCategory.current = ""

                updateAccordionDefaults()
            }
        }

        setAddNewCategoryMode(!addNewCategoryMode)
    }

    const addExisitingCategoryToDelete = (categoryID: number, newVal: boolean) => {
        if (newVal) {
            deleteExistingCategories.current.add(categoryID)
        } else {
            deleteExistingCategories.current.delete(categoryID)
        }

        setManualRendersCount(prev => prev + 1)
    }

    const changeCategoryName = (categoryID: number, categoryName: string) => {
        if (categoryID < 0) {
            keysOfNewCategories.current.delete(categories.current.get(categoryID)!)
            keysOfNewCategories.current.set(categoryName, categoryID)
        }

        modifyExistingCategories.current.set(categoryID, categoryName)

        if (categoryName === categories.current.get(categoryID)) {
            modifyExistingCategories.current.delete(categoryID)
        }
    }

    const deleteNewCategory = (categoryID: number, categoryName: string) => {
        newWordPhrases.current.delete(categoryID)
        categories.current.delete(categoryID)
        keysOfNewCategories.current.delete(categoryName)
    }

    const changeEditMode = async () => {

        if (editMode) {

            setSaving(true)

            if (localStorage.getItem(isAuth) === trueStr && deleteExistingCategories.current.size > 0) {
                deleteExistingCategories.current.forEach((categoryID: number) => {
                    wordBank.current.delete(categoryID)
                    categories.current.delete(categoryID)
                    deleteExistingWordPhrases.current.delete(categoryID)
                    modifyExistingWordPhrases.current.delete(categoryID)
                    modifyExistingCategories.current.delete(categoryID)
                })

                const jsonData = Array.from(deleteExistingCategories.current)

                try {
                    await api.delete('/wordbank/categories', {data: jsonData})

                } catch (error: any) {
                    setAuthInLocalStorage(error)
                    console.error("Error deleting requested categories", error)
                }
            }

            if (localStorage.getItem(isAuth) === trueStr && deleteExistingWordPhrases.current.size > 0) {
                deleteExistingWordPhrases.current.forEach((wordIDs: Set<number>, categoryID: number) => {
                    for (const wordID of wordIDs) {
                        wordBank.current.get(categoryID)?.delete(wordID)
                        if (modifyExistingWordPhrases.current.has(categoryID)) {
                            modifyExistingWordPhrases.current.get(categoryID)?.delete(wordID)
                            if (modifyExistingWordPhrases.current.get(categoryID)?.size == 0) {
                                modifyExistingWordPhrases.current.delete(categoryID)
                            }
                        }
                    }
                })

                const jsonData: number[] = []

                deleteExistingWordPhrases.current.forEach((wordIDs: Set<number>, _) => {
                    wordIDs.forEach((wordID) => {
                        jsonData.push(wordID)
                    })
                })

                try {
                    await api.delete('/wordbank/word-phrases', {data: jsonData})

                } catch (error) {
                    setAuthInLocalStorage(error)
                    console.error("Error deleting requested word-phrases", error)
                }
            }

            if (localStorage.getItem(isAuth) === trueStr && modifyExistingCategories.current.size > 0) {
                const jsonData: Record<number, string> = {}

                let count = 0

                modifyExistingCategories.current.forEach((newCategoryName: string, categoryID: number) => {
                    if (newCategoryName !== categories.current.get(categoryID)) {
                        count += 1
                        jsonData[categoryID] = newCategoryName
                        categories.current.set(categoryID, newCategoryName)
                    }
                })
                
                if (count > 0) {
                    try {
                        await api.put('/wordbank/categories', jsonData)

                        updateAccordionDefaults()
                    } catch (error) {
                        setAuthInLocalStorage(error)
                        console.error("Error modifying requested categories", error)
                    }
                }
            }

            if (localStorage.getItem(isAuth) === trueStr && modifyExistingWordPhrases.current.size > 0) {
                modifyExistingWordPhrases.current.forEach((wordPhrases: Map<number, string>, categoryID: number) => {
                    wordPhrases.forEach((modifiedWordPhrase: string, wordID: number) => {
                        wordBank.current.get(categoryID)?.set(wordID, modifiedWordPhrase)
                    })
                })

                const jsonData: Record<number, Record<number, string>> = {}

                modifyExistingWordPhrases.current.forEach((wordPhrases: Map<number, string>, categoryID: number) => {
                    jsonData[categoryID] = {}

                    wordPhrases.forEach((modifiedWordPhrase: string, wordID: number) => {
                        jsonData[categoryID][wordID] = modifiedWordPhrase
                    })
                })

                try {
                    await api.put('/wordbank/word-phrases', jsonData)

                } catch (error) {
                    setAuthInLocalStorage(error)
                    console.error("Error modifying requested word-phrases", error)
                }
            }

            if (localStorage.getItem(isAuth) === trueStr && keysOfNewCategories.current.size > 0) {

                const newCategories = Array.from(keysOfNewCategories.current.keys())

                try {
                    
                    const resp1 = await api.post('/wordbank/categories', newCategories)

                    resp1.data.forEach((row: Category) => {
                        const newCategoryWordPhrases = newWordPhrases.current.get(keysOfNewCategories.current.get(row.word_category)!) || []
                        
                        newWordPhrases.current.delete(keysOfNewCategories.current.get(row.word_category)!)

                        newWordPhrases.current.set(row.word_category_id, newCategoryWordPhrases)

                        categories.current.delete(keysOfNewCategories.current.get(row.word_category)!)
                        categories.current.set(row.word_category_id, row.word_category)

                        wordBank.current.set(row.word_category_id, new Map<number, string>())

                        updateAccordionDefaults()
                    })

                } catch (error) {
                    setAuthInLocalStorage(error)
                    console.error("Error adding new requested word-categories", error)
                }
            }
            
            if (localStorage.getItem(isAuth) === trueStr && newWordPhrases.current.size > 0) {

                const jsonData: Record<number, string[]> = {}

                newWordPhrases.current.forEach((wordPhrases: string[], categoryID: number) => {
                    jsonData[categoryID] = wordPhrases
                })

                try {
                    const resp = await api.post('/wordbank/word-phrases', jsonData)

                    resp.data.forEach((row: WordPhrase) => {
                        wordBank.current.get(row.word_category_id)!.set(row.word_id, row.word_phrase)
                    })

                } catch (error) {
                    setAuthInLocalStorage(error)
                    console.error("Error adding newly requested word-phrases", error)
                }
            }
            
            clearTempData()
            setSaving(false)

        }

        setEditMode(!editMode)

    }

    const cancelChanges = () => {

        clearTempData()

        if (addNewCategoryMode) {
            setAddNewCategoryMode(false)
        }

        setEditMode(false)
    }

    if (localStorage.getItem(isAuth) === null || localStorage.getItem(isAuth) === falseStr ) {
        return <Navigate to="/" replace />
    }

    if (loading) {
        return <Loading spinnerAction={loadingStr}/>
    }

    if (saving) {
        return <Loading spinnerAction={savingStr}/>
    }

    const clearTempData = () => {
        modifyExistingWordPhrases.current.clear()
        newWordPhrases.current.clear()
        deleteExistingWordPhrases.current.clear()
        deleteExistingCategories.current.clear()
        keysOfNewCategories.current.clear()
    }

    const logoutUser = async () => {
        try {
            localStorage.setItem(isAuth, falseStr)
            window.location.href = "http://localhost:8000/auth/logout"
            
        } catch(error) {
            console.error("Error logging user out", error)
        }
    }
    

    return (
        
        <div>
            
            <div className="mb-4 flex">
                <Button key="edit-wordbank" className="mr-2" onClick={changeEditMode}>
                    {editMode ? "Save changes" : "Edit"}
                </Button>
                
                {editMode && <Button key="cancel-changes" className="bg-red-600 hover:bg-red-500 mr-4" onClick={cancelChanges}>Cancel</Button>}
                {addNewCategoryMode && <Input id="new-category-name" className="mr-2" defaultValue={newCategory.current} onChange={(e) => newCategory.current = e.target.value}/>}
                {editMode && 
                    <Button key="add-category" className="bg-green-600 hover:bg-green-500" onClick={changeCategoryMode}>
                        {addNewCategoryMode ? "Add" : "New Category"}
                    </Button>
                }

            </div>

            <Accordion type="multiple" value={accordionDefaults} onValueChange={(v) => setAccordionDefaults(v)} >
                {Array.from(categories.current).map(([categoryID, categoryName]) => (     
                    <AccordionItem key={"item-" + categoryID.toString()} className="border-0 border-primary mb-4 p-4 rounded bg-gray-100" value={categoryName + "-" + categoryID.toString()} disabled={deleteExistingCategories.current.has(categoryID)}>
                        {editMode ? 
                            <div className="flex gap-2 items-center mb-2">
                                {categoryID < 0 ? 
                                    <Button key={"new-category" + categoryID.toString()} className="bg-red-600 hover:bg-red-500" onClick={() => deleteNewCategory(categoryID, categoryName)}>Delete</Button> :
                                    <Checkbox id={"existing-category-cb-" + categoryID.toString()} className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" onCheckedChange={(val) => addExisitingCategoryToDelete(categoryID, Boolean(val))} />
                                }
                                <Input id={"existing-category-" + categoryID.toString()} className={`${deleteExistingCategories.current.has(categoryID) ? "border border-red-600 text-red-600" : "border border-gray-400"}`} defaultValue={categoryName} onChange={(e) => changeCategoryName(categoryID, e.target.value)} disabled={deleteExistingCategories.current.has(categoryID)}/>
                            </div> : <Label className="text-xl mb-2">{categoryName}</Label>
                        }
                        <AccordionTrigger key={"existing-category-" + categoryID.toString()} className="text-2xl bg-primary rounded-t-lg p-2 text-primary-foreground">
                        </AccordionTrigger>
                        <AccordionContent key={"category-content-" + categoryID.toString()} className="p-2 bg-secondary rounded-b-lg">
                            <Table key={"table-" + categoryID.toString()}>
                                <TableBody key={"tablebody-" + categoryID.toString()}>
                                    {Array.from(wordBank.current.get(categoryID) ?? []).map(([wordID, wordPhrase]) => (
                                        <TableRow key={"existing-row-" + wordID.toString()} className="border-b border-neutral-400">
                                            <TableCell key={"existing-cell-1-" + wordID.toString()}>
                                                {editMode ? <span id={"existing-span-" + wordID.toString()} className="flex gap-2 items-center"> 
                                                    <Checkbox id={"existing-cb-" + categoryID.toString() + wordID.toString()} className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" onCheckedChange={(val) => modifyDeleteWordPhrases(categoryID, wordID, Boolean(val))} disabled={deleteExistingCategories.current.has(categoryID)}/>
                                                    <Input id={"existing-input-" + categoryID.toString() + wordID.toString()} className={`${deleteExistingWordPhrases.current.get(categoryID)?.has(wordID) || deleteExistingCategories.current.has(categoryID) ? "border-red-600 text-red-600" : "border-gray-400"}`} defaultValue={wordPhrase} onChange={(e) => changeExisitingWordPhrase(categoryID, wordID, e.target.value)} disabled={deleteExistingWordPhrases.current.get(categoryID)?.has(wordID) || deleteExistingCategories.current.has(categoryID)}/> </span> : wordPhrase
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
                            {editMode && <Button key={"add-new-" + categoryID.toString()} className="w-full bg-green-700 hover:bg-green-600" onClick={() => addNewWordPhrase(categoryID)} disabled={deleteExistingCategories.current.has(categoryID)}>Add</Button>}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            <Button className="bg-red-700 hover:bg-red-400" onClick={logoutUser}>Logout</Button>
        </div>
    )
}

export default WordBank