import { useState } from "react"
import api from "@/api"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Search } from "lucide-react"
import { setAuthInLocalStorage } from "@/commons"

type ThesaurusMatch = {
    source: "word_phrase" | "vocabulary_word"
    text: string
    similarity: number
}

type ThesaurusResponse = {
    query: string
    strongest_match: ThesaurusMatch | null
    top_matches: ThesaurusMatch[]
}

const sourceLabel = {
    word_phrase: "Phrase",
    vocabulary_word: "Vocabulary",
}

interface ThesaurusSidebarProps {
    isOpen: boolean
}

export function ThesaurusSearch({ isOpen }: ThesaurusSidebarProps) {
    const [query, setQuery] = useState<string>("")
    const [searching, setSearching] = useState<boolean>(false)
    const [result, setResult] = useState<ThesaurusResponse | null>(null)

    const toPercentage = (value: number) => `${(value * 100).toFixed(2)}%`

    const searchThesaurus = async () => {
        const cleaned = query.trim()

        if (!cleaned) {
            setResult(null)
            return
        }

        try {
            setSearching(true)
            const resp = await api.post<ThesaurusResponse>("/ai/thesaurus-search", { query: cleaned })
            setResult(resp.data)
        } catch (error) {
            setAuthInLocalStorage(error)
            console.error("Error searching thesaurus", error)
            setResult(null)
        } finally {
            setSearching(false)
        }
    }

    if (!isOpen) {
        return null
    }

    return (
        <aside className="fixed right-0 top-0 z-40 h-screen w-80 border-l bg-background/95 shadow-md backdrop-blur">
            <div className="flex h-full flex-col gap-3 p-3">
                        <div>
                            <h2 className="text-sm font-semibold">Thesaurus Search</h2>
                            <p className="text-xs text-muted-foreground">
                                Find strongest matches from your phrases and vocabulary.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search phrase or word"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        searchThesaurus()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={searchThesaurus}
                                disabled={searching}
                            >
                                <Search size={14} />
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {!result && (
                                <p className="text-sm text-muted-foreground">
                                    Enter a word or phrase to search.
                                </p>
                            )}

                            {result && (
                                <div className="space-y-3">
                                    <div className="rounded-md border bg-card p-3">
                                        <p className="text-xs text-muted-foreground">Strongest Match</p>
                                        {result.strongest_match ? (
                                            <>
                                                <p className="mt-1 text-sm font-semibold">{result.strongest_match.text}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sourceLabel[result.strongest_match.source]} | Similarity: {toPercentage(result.strongest_match.similarity)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                No strong match found.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Top 5 Strongest Matches
                                        </p>

                                        {result.top_matches.length === 0 ? (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                No matches available.
                                            </p>
                                        ) : (
                                            <div className="mt-2 space-y-2">
                                                {result.top_matches.map((match, index) => (
                                                    <div
                                                        key={`${match.source}-${match.text}-${index}`}
                                                        className="rounded-md border p-2"
                                                    >
                                                        <p className="text-sm">{match.text}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {sourceLabel[match.source]} | Similarity: {toPercentage(match.similarity)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
            </div>
        </aside>
    )
}

export default ThesaurusSearch
