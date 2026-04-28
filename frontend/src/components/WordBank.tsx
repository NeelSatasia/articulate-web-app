import { useEffect, useState, useRef, type ChangeEvent } from 'react'
import api from '../api'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import "/src/WordBank.css"
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { falseStr, initAuthInLocalStorage, isAuth, loadingStr, savingStr, setAuthInLocalStorage, trueStr, type Category, type WordPhrase } from '../commons'
import Loading from './Loading'
import { Navigate } from 'react-router-dom'

const WordBank = () => {

    type ImportedWordPhrase = {
        id: number
        text: string
        categoryId: string
    }

    const [_, setManualRendersCount] = useState<number>(0)

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
    const [importedWordPhrases, setImportedWordPhrases] = useState<ImportedWordPhrase[]>([])
    const [showImportPanel, setShowImportPanel] = useState<boolean>(false)
    const [importError, setImportError] = useState<string>("")
    const [bulkAssignCategoryId, setBulkAssignCategoryId] = useState<string>("")

    const importFileInputRef = useRef<HTMLInputElement>(null)

    initAuthInLocalStorage()

    const updateAccordionDefaults = () => {
        const updatedDefaults = Array.from(categories.current).map(
            ([categoryID, categoryName]) => `${categoryName}-${categoryID}`
        )

        setAccordionDefaults(updatedDefaults)
    }

    useEffect(() => {
        const getWordBank = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const getCategories = await api.get('/wordbank/categories')

                    getCategories.data.forEach((row: Category) => {
                        categories.current.set(row.word_category_id, row.word_category)
                    })

                    const getWordBank = await api.get('/wordbank')

                    getWordBank.data.forEach((row: WordPhrase) => {
                        
                        if (!wordBank.current.has(row.word_category_id)) {
                            wordBank.current.set(row.word_category_id, new Map<number, string>())
                        }

                        wordBank.current.get(row.word_category_id)!.set(row.word_id, row.word_phrase)
                        
                    })

                    localStorage.setItem(isAuth, trueStr)

                    updateAccordionDefaults()
                }

            } catch (error: any) {
                setAuthInLocalStorage(error)
                console.error("Error fetching user word-bank", error)
            } finally {
                setLoading(false)
            }
        }

        getWordBank()
    }, [])

    const addNewWordPhrase = (categoryID: number) => {

        if (!newWordPhrases.current.has(categoryID)) {
            newWordPhrases.current.set(categoryID, [])
        }

        newWordPhrases.current.get(categoryID)?.push("")

        setManualRendersCount(prev => prev + 1)

    }

    const changeNewWordPhrase = (categoryID: number, index: number, newValue: string) => {
        newWordPhrases.current.get(categoryID)![index] = newValue
    }

    const deleteNewWordPhrase = (categoryID: number, index: number) => {
        newWordPhrases.current.get(categoryID)?.splice(index, 1)

        if (newWordPhrases.current.get(categoryID)?.length == 0) {
            newWordPhrases.current.delete(categoryID)
        }

        setManualRendersCount(prev => prev + 1)
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

    const getAvailableCategoryEntries = () => {
        return Array.from(categories.current).filter(([categoryID]) => !deleteExistingCategories.current.has(categoryID))
    }

    const openImportFilePicker = () => {
        setImportError("")
        importFileInputRef.current?.click()
    }

    const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (!file) {
            return
        }

        setImportError("")

        const maxFileSizeInBytes = 5 * 1024 * 1024
        if (file.size > maxFileSizeInBytes) {
            setImportError("File is too large. Maximum file size is 5 MB.")
            e.target.value = ""
            return
        }

        if (!file.name.toLowerCase().endsWith(".txt")) {
            setImportError("Only .txt files are supported.")
            e.target.value = ""
            return
        }

        const availableCategories = getAvailableCategoryEntries()
        if (availableCategories.length === 0) {
            setImportError("Create at least one category before importing word-phrases.")
            e.target.value = ""
            return
        }

        try {
            const fileContent = await file.text()
            const uniqueLines = Array.from(
                new Set(
                    fileContent
                        .split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                )
            )

            if (uniqueLines.length === 0) {
                setImportError("The selected file is empty.")
                e.target.value = ""
                return
            }

            const defaultCategoryId = String(availableCategories[0][0])

            setImportedWordPhrases(
                uniqueLines.map((line, index) => ({
                    id: index,
                    text: line,
                    categoryId: defaultCategoryId,
                }))
            )
            setShowImportPanel(true)
        } catch (error) {
            console.error("Error importing txt file", error)
            setImportError("Failed to read file. Please try again.")
        } finally {
            e.target.value = ""
        }
    }

    const changeImportedCategory = (itemId: number, categoryId: string) => {
        setImportedWordPhrases(prev =>
            prev.map(item => (item.id === itemId ? { ...item, categoryId } : item))
        )
    }

    const applyBulkCategoryAssignment = () => {
        if (!bulkAssignCategoryId.trim()) {
            setImportError("Please select a category to apply to all items.")
            return
        }

        setImportedWordPhrases(prev =>
            prev.map(item => ({ ...item, categoryId: bulkAssignCategoryId }))
        )
        setBulkAssignCategoryId("")
    }

    const applyImportedWordPhrases = () => {
        if (importedWordPhrases.length === 0) {
            setImportError("No word-phrases to import.")
            return
        }

        if (importedWordPhrases.some(item => item.categoryId.trim() === "")) {
            setImportError("Please select a category for each imported line.")
            return
        }

        importedWordPhrases.forEach((item) => {
            const categoryId = parseInt(item.categoryId, 10)

            if (!newWordPhrases.current.has(categoryId)) {
                newWordPhrases.current.set(categoryId, [])
            }

            newWordPhrases.current.get(categoryId)?.push(item.text)
        })

        setImportedWordPhrases([])
        setShowImportPanel(false)
        setImportError("")
        setManualRendersCount(prev => prev + 1)
    }

    const cancelImportedWordPhrases = () => {
        setImportedWordPhrases([])
        setShowImportPanel(false)
        setImportError("")
        setBulkAssignCategoryId("")
    }

    const changeEditMode = async () => {

        if (editMode) {

            setSaving(true)

            //TODO: check if modified/new entries are empty

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
                    await api.put('/ai/word-phrases', jsonData)

                } catch (error) {
                    setAuthInLocalStorage(error)
                    console.error("Error modifying requested word-phrases", error)
                }
            }

            if (localStorage.getItem(isAuth) === trueStr && keysOfNewCategories.current.size > 0) {

                const newCategories = Array.from(keysOfNewCategories.current.keys())

                try {
                    
                    const resp = await api.post('/wordbank/categories', newCategories)

                    resp.data.forEach((row: Category) => {
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
                    const resp = await api.post('/ai/word-phrases', jsonData)

                    resp.data.forEach((row: WordPhrase) => {
                        wordBank.current.get(row.word_category_id)!.set(row.word_id, row.word_phrase)
                    })

                    setManualRendersCount(prev => prev + 1)

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
        setImportedWordPhrases([])
        setShowImportPanel(false)
        setImportError("")
        setBulkAssignCategoryId("")
    }
    

    return (
        <div className="w-full p-4 sm:p-6">
            <div>
                <div className="mb-5 rounded-lg border bg-card p-4">
                    <h1 className="text-2xl font-semibold">Commonplace Book</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Organize your categories and word-phrases. Expand a category to view or edit its entries.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button key="edit-wordbank" size="sm" onClick={changeEditMode}>
                            {editMode ? "Save" : "Edit"}
                        </Button>

                        {editMode && (
                            <Button key="cancel-changes" size="sm" className="bg-red-500 hover:bg-red-400" onClick={cancelChanges}>
                                Cancel
                            </Button>
                        )}

                        {addNewCategoryMode && (
                            <Input
                                id="new-category-name"
                                className="max-w-sm"
                                defaultValue={newCategory.current}
                                onChange={(e) => newCategory.current = e.target.value}
                            />
                        )}

                        {editMode && (
                            <Button key="add-category" size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={changeCategoryMode}>
                                {addNewCategoryMode ? "Add" : "New Category"}
                            </Button>
                        )}

                        {editMode && (
                            <Button key="import-word-phrases" size="sm" variant="outline" onClick={openImportFilePicker}>
                                Import .txt
                            </Button>
                        )}

                        <input
                            ref={importFileInputRef}
                            type="file"
                            accept=".txt,text/plain"
                            className="hidden"
                            onChange={handleImportFile}
                        />
                    </div>

                    {importError && (
                        <p className="mt-3 text-sm text-red-600">{importError}</p>
                    )}
                </div>

                {showImportPanel && (
                    <div className="mb-5 rounded-lg border bg-card p-4">
                        <h2 className="text-lg font-semibold">Assign Categories Before Import</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Each line from your file is listed below. Select a category for every item before adding to your word bank.
                        </p>

                        <div className="mt-4 flex flex-wrap items-end gap-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium">Assign all to category:</label>
                                <select
                                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                    value={bulkAssignCategoryId}
                                    onChange={(e) => setBulkAssignCategoryId(e.target.value)}
                                >
                                    <option value="">Select a category...</option>
                                    {getAvailableCategoryEntries().map(([categoryId, categoryName]) => (
                                        <option key={`bulk-category-option-${categoryId}`} value={String(categoryId)}>
                                            {categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button size="sm" variant="secondary" onClick={applyBulkCategoryAssignment}>
                                Apply to All
                            </Button>
                        </div>

                        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                            {importedWordPhrases.map((item) => (
                                <div key={`imported-word-phrase-${item.id}`} className="grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-[2fr,1fr] sm:items-center">
                                    <p className="text-sm">{item.text}</p>
                                    <select
                                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                                        value={item.categoryId}
                                        onChange={(event) => changeImportedCategory(item.id, event.target.value)}
                                    >
                                        {getAvailableCategoryEntries().map(([categoryId, categoryName]) => (
                                            <option key={`import-category-option-${categoryId}`} value={String(categoryId)}>
                                                {categoryName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={applyImportedWordPhrases}>
                                Add to Draft Changes
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelImportedWordPhrases}>
                                Cancel Import
                            </Button>
                        </div>
                    </div>
                )}

                {categories.current.size == 0 ? (
                    <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                        Your commonplace book is currently empty.
                    </div>
                ) : (
                    <Accordion type="multiple" value={accordionDefaults} onValueChange={(v) => setAccordionDefaults(v)} className="space-y-4">
                        {Array.from(categories.current).map(([categoryID, categoryName]) => (
                            <AccordionItem
                                key={"item-" + categoryID.toString()}
                                className="overflow-hidden rounded-lg border bg-card"
                                value={categoryName + "-" + categoryID.toString()}
                                disabled={deleteExistingCategories.current.has(categoryID)}
                            >
                                {editMode && (
                                    <div className="p-4 pb-2">
                                        <div className="flex items-center gap-2">
                                            {categoryID < 0 ? (
                                                <Button key={"new-category" + categoryID.toString()} className="bg-red-600 hover:bg-red-500" size="sm" onClick={() => deleteNewCategory(categoryID, categoryName)}>
                                                    Delete
                                                </Button>
                                            ) : (
                                                <Checkbox
                                                    id={"existing-category-cb-" + categoryID.toString()}
                                                    className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                    onCheckedChange={(val) => addExisitingCategoryToDelete(categoryID, Boolean(val))}
                                                />
                                            )}
                                            <Input
                                                id={"existing-category-" + categoryID.toString()}
                                                className={`${deleteExistingCategories.current.has(categoryID) ? "border border-red-600 text-red-600" : "border border-border"}`}
                                                defaultValue={categoryName}
                                                onChange={(e) => changeCategoryName(categoryID, e.target.value)}
                                                disabled={deleteExistingCategories.current.has(categoryID)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <AccordionTrigger key={"existing-category-" + categoryID.toString()} className="px-4 py-3 text-left text-2xl font-semibold text-card-foreground hover:bg-muted/30">
                                    {categoryName}
                                </AccordionTrigger>

                                <AccordionContent key={"category-content-" + categoryID.toString()} className="border-t bg-background px-4 pb-4 pt-2">
                                    <Table key={"table-" + categoryID.toString()}>
                                        <TableBody key={"tablebody-" + categoryID.toString()}>
                                            {Array.from(wordBank.current.get(categoryID) ?? []).map(([wordID, wordPhrase]) => (
                                                <TableRow key={"existing-row-" + wordID.toString()} className="border-b border-border last:border-b-0">
                                                    <TableCell key={"existing-cell-1-" + wordID.toString()}>
                                                        {editMode ? <span id={"existing-span-" + wordID.toString()} className="flex items-center gap-2">
                                                            <Checkbox id={"existing-cb-" + categoryID.toString() + wordID.toString()} className="border-red-600 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" onCheckedChange={(val) => modifyDeleteWordPhrases(categoryID, wordID, Boolean(val))} disabled={deleteExistingCategories.current.has(categoryID)}/>
                                                            <Input id={"existing-input-" + categoryID.toString() + wordID.toString()} className={`${deleteExistingWordPhrases.current.get(categoryID)?.has(wordID) || deleteExistingCategories.current.has(categoryID) ? "border-red-600 text-red-600" : "border-border"}`} defaultValue={wordPhrase} onChange={(e) => changeExisitingWordPhrase(categoryID, wordID, e.target.value)} disabled={deleteExistingWordPhrases.current.get(categoryID)?.has(wordID) || deleteExistingCategories.current.has(categoryID)}/> </span> : <span className="text-sm">{wordPhrase}</span>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {Array.from(newWordPhrases.current.get(categoryID) || []).map((newWordPhrase, index) => (
                                                <TableRow key={"new-row-" + index.toString()} className="border-b border-border last:border-b-0">
                                                    <TableCell key={"new-cell-1-" + index.toString()}>
                                                        <span id={"new-span-" + index.toString()} className="flex items-center gap-2">
                                                            <Button key={"new-del-" + categoryID.toString() + index.toString()} className="bg-red-600 hover:bg-red-500" size="sm" onClick={() => deleteNewWordPhrase(categoryID, index)}>Delete</Button>
                                                            <Input id={"new-input-" + categoryID.toString() + index.toString()} placeholder="Enter word/phrase here... " defaultValue={newWordPhrase} onChange={e => changeNewWordPhrase(categoryID, index, e.target.value)}/>
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {editMode && <Button key={"add-new-" + categoryID.toString()} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500" onClick={() => addNewWordPhrase(categoryID)} disabled={deleteExistingCategories.current.has(categoryID)}>Add</Button>}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        </div>
    )
}

export default WordBank