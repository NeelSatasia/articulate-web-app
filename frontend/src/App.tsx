import { initAuthInLocalStorage } from "./commons"
import { Button } from "./components/ui/button"
import { backendServiceURL } from "./commons"

function App() {

    initAuthInLocalStorage()

    const googleSign = () => {
        window.location.href = `${backendServiceURL}/auth/login`
    }

    return (
        <div className="min-h-screen bg-background text-foreground bg-neutral-100">
            <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-8 px-6 py-10 lg:flex-row lg:items-center lg:gap-14">
                <section className="max-w-2xl">
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                        Learn with daily writing practice
                    </p>
                    <h1 className="text-4xl font-semibold leading-tight md:text-5xl tracking-wider">
                        Become Articulate...
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground md:text-lg">
                        ...lets you store creative phrases and vocabulary words which you can utilize to build stronger English expressions through short, guided activities that combine vocabulary growth, sentence crafting, and writing feedback.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm font-semibold">Build vocabulary in context</p>
                            <p className="mt-1 text-sm text-muted-foreground">Learn words with definitions, examples, and recall practice.</p>
                        </div>
                        <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm font-semibold">Improve writing clarity</p>
                            <p className="mt-1 text-sm text-muted-foreground">Practice rewriting and compression to keep ideas precise.</p>
                        </div>
                        <div className="rounded-lg border bg-card p-4">
                            <p className="text-sm font-semibold">Get instant feedback</p>
                            <p className="mt-1 text-sm text-muted-foreground">Use AI-assisted checks to refine grammar and meaning.</p>
                        </div>
                    </div>
                </section>

                <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
                    <h2 className="text-2xl font-semibold">Welcome</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Sign in to save your progress and continue your writing journey.
                    </p>
                    <Button
                        onClick={googleSign}
                        className="mt-6 w-full py-3"
                    >
                        Sign In with Google
                    </Button>
                </section>
            </main>
        </div>
    )
}

export default App