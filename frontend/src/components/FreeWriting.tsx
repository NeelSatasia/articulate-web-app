import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { setAuthInLocalStorage } from "@/commons";
import api from "../api";
import { Spinner } from "./ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface SentenceSuggestion {
    sentence_index: number;
    sentence: string;
    highlight: boolean;
    suggested_word: string | null;
    suggested_definition: string | null;
    similarity: number | null;
    highlight_rank: number | null;
}

interface SentenceSuggestionResponse {
    text: string;
    suggestions: SentenceSuggestion[];
}

const highlightStyles = [
    "bg-primary/15 border-primary/30",
    "bg-emerald-100 border-emerald-300",
    "bg-amber-100 border-amber-300",
    "bg-rose-100 border-rose-300",
    "bg-violet-100 border-violet-300",
]

const getHighlightStyle = (rank: number) => highlightStyles[rank - 1] ?? highlightStyles[0]

const FreeWriting = () => {
    const [rawInput, setRawInput] = useState<string>("");
    const [reviewResult, setReviewResult] = useState<SentenceSuggestionResponse | null>(null);
    const [isReviewed, setIsReviewed] = useState<boolean>(false);
    const [loadingData, setLoadingData] = useState<boolean>(false);

    const reviewRawInput = async () => {
        if (!rawInput.trim()) return;

        try {
            setLoadingData(true);
            const resp = await api.post("/ai/sentence-vocabulary-suggestions", { text: rawInput });
            setReviewResult(resp.data as SentenceSuggestionResponse);
            setIsReviewed(true);
        } catch (error) {
            setAuthInLocalStorage(error);
            console.error("Error generating sentence-level vocabulary suggestions", error);
        } finally {
            setLoadingData(false);
        }
    };

    const resetReview = () => {
        setIsReviewed(false);
        setReviewResult(null);
    };

    const highlightedSuggestionsInTextOrder = reviewResult
        ? reviewResult.suggestions
            .filter((item) => item.highlight && item.suggested_word && item.similarity !== null)
            .sort((a, b) => a.sentence_index - b.sentence_index)
        : []

    const uniqueSuggestions = highlightedSuggestionsInTextOrder.reduce<SentenceSuggestion[]>((acc, item) => {
        if (!acc.some((existing) => existing.suggested_word === item.suggested_word)) {
            acc.push(item)
        }
        return acc
    }, [])

    const wordToStyleMap = uniqueSuggestions.reduce<Record<string, string>>((acc, item, index) => {
        if (item.suggested_word) {
            acc[item.suggested_word] = getHighlightStyle((index % highlightStyles.length) + 1)
        }
        return acc
    }, {})

    const getStyleForWord = (word: string | null) => {
        if (!word) {
            return ""
        }
        return wordToStyleMap[word] ?? highlightStyles[0]
    }

    return (
        <div className="p-4 flex flex-col gap-y-4">
            <Textarea
                placeholder="Start free writing or paste your response about a topic here..."
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                disabled={isReviewed}
            />

            <div className="flex gap-2">
                <Button className="w-fit" onClick={reviewRawInput} disabled={loadingData || !rawInput.trim() || isReviewed}>
                    {loadingData ? <Spinner /> : "Review"}
                </Button>
                {isReviewed && (
                    <Button className="w-fit" variant="outline" onClick={resetReview} disabled={loadingData}>
                        Try Again
                    </Button>
                )}
            </div>

            {isReviewed && (
                <div className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Word Suggestions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reviewResult && reviewResult.suggestions.length > 0 ? (
                                <div className="whitespace-pre-wrap leading-8">
                                    {reviewResult.suggestions.map((item, index) => (
                                        <span
                                            key={`sentence-suggestion-${index}`}
                                            className={item.highlight && item.suggested_word
                                                ? `rounded border px-1 py-0.5 ${getStyleForWord(item.suggested_word)}`
                                                : ""}
                                            title={item.highlight && item.suggested_word && item.similarity !== null
                                                ? `${item.suggested_word} (${(item.similarity * 100).toFixed(2)}%)`
                                                : undefined}
                                        >
                                            {item.sentence.trim()}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p>No sentence highlights were found.</p>
                            )}

                            {reviewResult && uniqueSuggestions.length > 0 && (
                                <ul className="mt-4 flex flex-col gap-y-1 text-sm text-muted-foreground">
                                    {uniqueSuggestions.map((item, index) => (
                                            <li key={`suggestion-label-${index}`} className={`rounded border px-2 py-1 ${getStyleForWord(item.suggested_word)}`}>
                                                <span className="font-medium text-foreground">{item.suggested_word}</span>
                                                {" "}({(item.similarity! * 100).toFixed(2)}%)
                                                {item.suggested_definition ? (
                                                    <span className="text-foreground"> - {item.suggested_definition}</span>
                                                ) : null}
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default FreeWriting;