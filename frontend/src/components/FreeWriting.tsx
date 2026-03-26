import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { setAuthInLocalStorage } from "@/commons";
import api from "../api";
import { Spinner } from "./ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";

interface SimilarWord {
    word: string;
    similarity: number;
}

const FreeWriting = () => {
    const [rawInput, setRawInput] = useState<string>("");
    const [editedInput, setEditedInput] = useState<string>("");
    const [similarWords, setSimilarWords] = useState<SimilarWord[]>([]);
    const [isReviewed, setIsReviewed] = useState<boolean>(false);
    const [loadingData, setLoadingData] = useState<boolean>(false);

    const reviewRawInput = async () => {
        if (!rawInput.trim()) return;

        try {
            setLoadingData(true);
            const resp = await api.post("/ai/relevant-vocabulary-words", { text: rawInput });
            setSimilarWords(resp.data);
            setEditedInput(rawInput);
            setIsReviewed(true);
        } catch (error) {
            setAuthInLocalStorage(error);
            console.error("Error fetching relevant vocabulary words", error);
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <div className="p-4 flex flex-col gap-y-4 justify-center items-center">
            <Textarea
                placeholder="Start free writing about a topic here..."
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                disabled={isReviewed}
            />
            <Button className="w-fit" onClick={reviewRawInput} disabled={loadingData || !rawInput.trim() || isReviewed}>
                {loadingData ? <Spinner /> : "Review"}
            </Button>

            {isReviewed && (
                <div className="flex flex-col gap-4 mt-4 justify-center items-center">
                    <div className="w-full md:w-1/3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 5 Relevant Vocabulary From Your Collection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {similarWords.length > 0 ? (
                                    <ul className="flex flex-col gap-y-2">
                                        {similarWords.map((item) => (
                                            <li key={item.word} className="flex justify-between">
                                                <span>{item.word}</span>
                                                <span className="text-muted-foreground">
                                                    {(item.similarity * 100).toFixed(2)}%
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No relevant vocabulary words found from your collection.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Label htmlFor="edited-input" className="mb-2 block">Edit your writing</Label>
                        <Textarea
                            id="edited-input"
                            placeholder="Edit your writing here..."
                            value={editedInput}
                            onChange={(e) => setEditedInput(e.target.value)}
                            rows={15}
                        />
                    </div>
                    
                </div>
            )}
        </div>
    );
};

export default FreeWriting;