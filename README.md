# [Become Articulate](https://become-articulate-1024922675216.us-south1.run.app/)

## Purpose
Become Articulate is an AI-assisted English writing practice app designed to help users express ideas more clearly, naturally, and confidently.

The product focuses on three learning outcomes:
1. Build practical vocabulary with context.
2. Improve sentence quality through guided rewriting.
3. Strengthen concise communication through progressive writing drills.

## Feature Overview
| Feature | What It Does | Why It Exists | User Benefit |
|---|---|---|---|
| Google Sign-In | Authenticates users with OAuth and creates a persistent session. | Keep user data private and personalized. | Users return to their own progress and practice history. |
| Dashboard | Shows active daily word-phrases and vocabulary words. | Reduce decision fatigue and provide a clear daily starting point. | Users can start practice immediately with focused material. |
| Commonplace Book | Lets users manage custom word categories and phrase collections. | Users learn better with personally relevant language. | Practice content reflects each user's interests and goals. |
| Vocabulary Builder | Adds vocabulary words, generates definitions/examples/CEFR level, stores items in user vocabulary, and supports review/delete. | Vocabulary acquisition needs structure and context, not isolated memorization. | Users get fast, usable word knowledge ready for writing. |
| Sentence Crafting | Generates a target sentence context, asks users to rewrite using a phrase, and evaluates grammar + semantic similarity. | Writing quality improves through constrained practice and feedback loops. | Users learn accurate, natural phrase usage in context. |
| Vocabulary Recall (MCQ) | Provides multiple-choice recall based on generated sentence cues. | Retrieval practice improves long-term retention. | Users remember words faster with lower cognitive friction. |
| Essence Writing | Compares 100-word, 50-word, and 25-word versions of the same idea using embeddings. | Concision is a core communication skill. | Users learn to preserve meaning while reducing length. |
| Free Writing Analyzer | Highlights top matching sentences against user vocabulary, suggests vocabulary with similarity scores, and shows definitions. | Transfer from drills to open writing requires contextual guidance. | Users integrate vocabulary into real writing with actionable cues. |
| Prompt Library | Supplies rotating writing prompts (optional in writing exercises). | Users sometimes need topic inspiration to begin writing. | Reduces blank-page friction and improves consistency. |
| Settings: Daily Recall Email Toggle | Stores a user preference for daily recall reminders. | Habit formation requires repetition and reminders. | Encourages sustained, long-term learning behavior. |

## AI and Language-Processing Capabilities
1. Sentence generation for phrase and word practice.
2. Grammar/spelling feedback with structured mistake hints.
3. Embedding-based semantic similarity scoring.
4. Sentence-level vocabulary suggestion using cosine similarity.
5. Vocabulary enrichment (definition, example, CEFR level) for newly added words.

## Tech Stack
### Frontend
- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Radix UI primitives
- Axios

### Backend
- FastAPI
- Pydantic
- Uvicorn
- Supabase Python client
- OpenAI Python SDK
- SciPy (cosine similarity calculations)
- python-dotenv

### Data, Auth, and Platform Services
- Supabase Postgres (data storage)
- Supabase Auth (Google OAuth flow)
- Server-side session middleware (Starlette SessionMiddleware)

