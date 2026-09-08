import { initAuthInLocalStorage } from "./commons"
import { Button } from "./components/ui/button"
import { backendServiceURL } from "./commons"
import { BookText, Mic, MessageSquareText, Layers3, ArrowRight } from "lucide-react"

function App() {

    initAuthInLocalStorage()

    const googleSign = () => {
        window.location.href = `${backendServiceURL}/auth/login`
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:flex-row lg:items-center lg:gap-12 lg:py-12">
                <section className="flex-1 space-y-8">

                    <div className="max-w-3xl space-y-5">
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                            Build stronger vocabulary through a focused practice loop.
                        </h1>
                        <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                            Organize your own word bank, open a guided situation for each word, answer by typing or speaking, and get structured AI feedback in the playground.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border bg-card p-5 shadow-sm">
                            <BookText className="size-5 text-primary" />
                            <p className="mt-4 text-sm font-semibold">Word bank control</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">Create categories, add new phrases, and keep everything organized in one place.</p>
                        </div>
                        <div className="rounded-2xl border bg-card p-5 shadow-sm">
                            <Layers3 className="size-5 text-primary" />
                            <p className="mt-4 text-sm font-semibold">Guided context</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">Each practice round starts with a situation that naturally calls for the target word.</p>
                        </div>
                        <div className="rounded-2xl border bg-card p-5 shadow-sm">
                            <Mic className="size-5 text-primary" />
                            <p className="mt-4 text-sm font-semibold">Voice input</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">Speak your response and let the playground update the answer field for you.</p>
                        </div>
                        <div className="rounded-2xl border bg-card p-5 shadow-sm">
                            <MessageSquareText className="size-5 text-primary" />
                            <p className="mt-4 text-sm font-semibold">Structured feedback</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">See a clean result view: situation, correct/incorrect status, feedback, and example when needed.</p>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-sm md:p-8">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            Start here
                        </p>
                        <h2 className="text-2xl font-semibold tracking-tight">Sign in and start practicing</h2>
                        <p className="text-sm leading-6 text-muted-foreground">
                            After Google sign-in, you can manage your word bank, launch a practice session, and get immediate AI evaluation on every response.
                        </p>
                    </div>

                    <div className="mt-6 space-y-3 rounded-2xl border bg-background p-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-secondary p-2 text-primary">
                                <BookText className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">1. Organize words</p>
                                <p className="text-sm text-muted-foreground">Add categories and phrases to your bank.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-secondary p-2 text-primary">
                                <Layers3 className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">2. Practice in context</p>
                                <p className="text-sm text-muted-foreground">Work through a situation built for the word.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-secondary p-2 text-primary">
                                <MessageSquareText className="size-4" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">3. Review the result</p>
                                <p className="text-sm text-muted-foreground">Use feedback and examples to improve.</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={googleSign}
                        className="mt-6 h-12 w-full rounded-full text-base"
                    >
                        Sign In with Google
                        <ArrowRight className="size-4" />
                    </Button>
                </section>
            </main>
        </div>
    )
}

export default App