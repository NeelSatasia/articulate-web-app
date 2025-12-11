import { useState } from 'react'
import api from '../api'

interface Categories {
    word_category_id: number
    word_category: string
}

interface WordPhrase {
    word_id: number
    word_phrase: string
}

interface CategoryWords {
    word_category: string
    wordsPhrases: WordPhrase[]
}

const WordBank = () => {

    const [categories, setCategories] = useState<Categories[]>([])
    const [wordBank, setWordBank] = useState<{ categoryID: number, categoryWords: CategoryWords[] }[]>([])

    const getCategories = async () => {
        try {
            const resp = await api.get('/wordbank/categories')
            setCategories(resp.data);
        } catch (error) {
            console.error("Error fetching categories", error)
        }
    }

    getCategories()

    if (categories.length > 0) {
        const getWordBank = async () => {
            try {
                const resp = await api.get('/wordbank')
                setWordBank(resp.data)
            } catch (error) {
                console.error("Error fetching word bank", error)
            }
        }

        getWordBank()
    }

    return (
        <div>
            {wordBank.map(() => (
                <div></div>
            ))}
        </div>
    );
};

export default WordBank