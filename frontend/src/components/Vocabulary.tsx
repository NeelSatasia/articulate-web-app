import api from "@/api";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from "./Loading";
import { falseStr, isAuth, trueStr, type VocabularyWord } from "../commons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";

const Vocabulary = () => {

    const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchVocabulary = async () => {
            try {
                if (localStorage.getItem(isAuth) === trueStr) {
                    const resp = await api.get('/vocabulary');
                    
                    localStorage.setItem(isAuth, trueStr);
                    console.log("Fetched vocabulary:", resp.data);
                    setVocabulary(resp.data);
                }
            } catch (error) {
                console.error("Error fetching vocabulary", error);
            } finally {
                setLoading(false);
            }
        }

        fetchVocabulary();
    }, []);


    const deleteWord = async (del_word_id: number) => {
        try {
            setLoading(true)
            await api.delete('/vocabulary', { data: { word_id: del_word_id } });
            setVocabulary(prevVocab => prevVocab.filter(word => word.word_id !== del_word_id))
        } catch (error) {
            console.error("Error deleting vocabulary word", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <Loading spinnerAction="Loading"/>;
    }

    if (localStorage.getItem(isAuth) === falseStr) {
        return <Navigate to="/" replace />
    }

    return (
        <div>
            <h1 className="text-3xl mb-4">Your Vocabulary</h1>

            {vocabulary.length === 0 ? (
                <div className="w-full h-full justify-center items-center">You have no vocabulary words yet.</div>
            ) :
                <div className="w-full p-2 outline outline-offset outline-primary rounded">
                    <Table key="user-vocabulary" className="rounded bg-neutral-100 rounded">
                        <TableHeader className="rounded-md">
                            <TableRow className="bg-neutral-300 hover:bg-neutral-300 rounded">
                                <TableHead className="w-1/4">Word</TableHead>
                                <TableHead className="w-2/4">Definition</TableHead>
                                <TableHead></TableHead>
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
                                        <Button onClick={() => deleteWord(vocabWord.word_id)} className="bg-red-600 hover:bg-red-500 text-white">
                                            Del
                                        </Button>
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