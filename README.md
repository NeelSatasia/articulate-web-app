# Become Articulate

Become Articulate is an AI-powered writing and vocabulary practice platform designed to help users internalize articulate words and phrases through contextual writing practice.

Instead of memorizing vocabulary in isolation, users build a personal collection of words and phrases and practice using them in realistic situations. The application uses AI to generate contextual exercises and evaluate whether the user's response demonstrates an appropriate understanding of the target word.

## Features

### 🔐 Google Authentication

Users authenticate through Google OAuth using Supabase Authentication.

After authentication, the backend creates a server-side session containing the user's identity and authentication tokens. Authenticated requests use this session to access user-specific data.

### 📚 Personal Word Bank

Users can create and organize their own collection of words and phrases.

The word bank supports:

* Creating word categories
* Adding multiple phrases to categories
* Editing category names
* Deleting phrases
* Deleting categories
* Tracking practice performance

Each word tracks:

* Number of successful attempts
* Number of failed attempts
* Average attempts required for a successful exercise
* Last attempted timestamp

### 🧠 AI-Powered Contextual Practice

The Playground provides an interactive exercise for each word.

The AI:

1. Selects the application's target word.
2. Generates a short situation where the word would naturally be appropriate.
3. Does not reveal the target word in the generated situation.
4. Asks the user to respond using the target word.
5. Evaluates the user's response.
6. Provides feedback when the response is insufficient.
7. Ends the exercise when the response is correct or the user reaches three unsuccessful attempts.

The AI is specifically instructed to evaluate whether the surrounding context demonstrates genuine understanding rather than simply checking whether the target word appears in the sentence.

### ✍️ Context-Based Vocabulary Learning

The application intentionally avoids treating vocabulary practice as simple sentence completion.

For an answer to be considered correct, the user's response must:

* Use the target word appropriately
* Demonstrate an understanding of its meaning
* Provide enough surrounding context to justify the word
* Use the word naturally
* Use an appropriate grammatical form

A grammatically valid sentence containing the target word is not automatically considered correct.

### 📊 Practice Progress

Words are automatically categorized on the dashboard based on their practice history:

* **Needs Review**
* **Getting There**
* **Strong**
* **Not Attempted Yet**

The categorization considers the user's average successful attempts, number of successful attempts, and whether the word has been practiced.

Words within categories are ordered by their last attempted timestamp.

### 📖 Vocabulary Collection

The application also maintains a vocabulary collection separate from the user's personal word bank.

Vocabulary entries contain:

* Word
* Definition
* Example
* CEFR/word level

Users can add and remove vocabulary words from their personal collection.

### ⚙️ User Settings

Users can configure whether they want daily vocabulary recall emails.

---

# Tech Stack

## Frontend

* React 19
* TypeScript
* Vite
* React Router
* Axios
* Tailwind CSS
* Radix UI
* Lucide React

The frontend dependencies and build scripts are defined in `frontend/package.json`.

## Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* Starlette
* Supabase Python Client
* OpenAI Python SDK
* SciPy
* python-dotenv

These dependencies are defined in `backend/requirements.txt`.

## Database & Authentication

* Supabase
* PostgreSQL
* Supabase Authentication
* Google OAuth

## AI

* OpenAI API
* `chat.completions`
* Custom system prompting for contextual vocabulary practice

---

# Architecture

The application is split into a React frontend and FastAPI backend.

```text
┌──────────────────────────────┐
│          React App           │
│        TypeScript/Vite       │
│                              │
│  Dashboard                  │
│  Vocabulary                 │
│  Playground                 │
│  Settings                   │
└──────────────┬───────────────┘
               │
               │ HTTP / Axios
               ▼
┌──────────────────────────────┐
│         FastAPI API          │
│                              │
│  /auth                       │
│  /user                       │
│  /wordbank                   │
│  /vocabulary                 │
│  /ai                         │
└───────┬──────────────┬───────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│   Supabase   │  │   OpenAI API │
│ PostgreSQL   │  │              │
│ Auth         │  │ AI exercises │
└──────────────┘  └──────────────┘
```

The FastAPI application registers the authentication, user, word bank, vocabulary, and AI routers. It also configures CORS and Starlette's session middleware.

---

# Authentication Flow

Authentication is handled through Google OAuth and Supabase.

```text
User
 │
 │ Sign in with Google
 ▼
React
 │
 │ GET /auth/login
 ▼
FastAPI
 │
 │ Supabase OAuth
 ▼
Google
 │
 │ Authentication
 ▼
Supabase
 │
 │ Authorization code
 ▼
/auth/callback
 │
 │ Exchange code for session
 ▼
FastAPI Session
 │
 │ Redirect
 ▼
React Dashboard
```

The frontend starts authentication by redirecting the browser to `/auth/login`.

The backend generates the Google OAuth URL through Supabase and uses `/auth/callback` as the redirect destination. After Google authentication, the backend exchanges the authorization code for a Supabase session.

The resulting session stores information including:

* User email
* Supabase UUID
* Application user ID
* Access token
* Refresh token
* Token expiration
* Current practice state

---

# Authenticated API Requests

Authenticated requests use the session created by the backend.

The `get_user_client` dependency retrieves the user's session and verifies that an access token exists.

If the token is close to expiring, the backend attempts to refresh it using the stored refresh token. The refreshed credentials are then stored back into the session.

The resulting access token is also applied to the Supabase PostgREST client:

```text
Browser
   │
   │ authenticated request
   ▼
FastAPI
   │
   │ retrieve session
   ▼
Supabase access token
   │
   │ authenticated PostgREST request
   ▼
Supabase
```

This allows database requests to execute in the context of the authenticated user.

---

# AI Practice System

The core learning experience is implemented through the `/ai/generate-word-context` endpoint.

The endpoint receives:

```json
{
  "word_id": 123,
  "user_response": "Example response..."
}
```

The request is represented by the following Pydantic model:

```python
class AIRequest(BaseModel):
    word_id: int
    user_response: str
```

The backend models define the request and response structures used throughout the application.

## Starting an Exercise

When a new exercise begins, the backend:

1. Retrieves the selected word from the user's word bank.
2. Stores the target word in the session.
3. Stores the target word ID.
4. Clears previous responses.
5. Resets the practice situation.
6. Retrieves the word's existing performance statistics.
7. Sends the target word to the AI through the system prompt.

## Generating the Situation

The AI is instructed to create a situation of no more than 30 words where the target word is naturally appropriate.

The target word itself must not appear in the generated situation.

The user must independently determine how the target word applies to the situation.

For example, if the target word is:

```text
scramble
```

the AI can generate a situation involving someone discovering that a meeting is about to start, without using "scramble" or its derivatives.

---

# Response Evaluation

The AI evaluates the user's response using several criteria:

### Word Meaning

Does the user use the target word according to a valid meaning?

### Contextual Justification

Does the surrounding context explain why the target word is appropriate?

### Naturalness

Would a proficient English speaker naturally use the word in this situation?

### Precision

Does the word communicate something important or precise about the situation?

### Grammar

Is the word used in an appropriate grammatical form?

The system explicitly prevents a response from being considered correct merely because the target word appears in a grammatically valid sentence.

---

# Three-Attempt System

Each exercise has a maximum of three attempts.

### First or Second Incorrect Attempt

The AI:

* Explains what is missing or incorrect
* Gives guidance
* Does not reveal the answer
* Asks the user to try again

### Correct Attempt

The AI responds with:

```text
Correct
```

The exercise ends immediately.

### Third Incorrect Attempt

The AI:

* Explains why the response was insufficient
* Provides a natural example answer
* Explains why the example works
* Ends the exercise

This behavior is defined in the vocabulary practice system prompt.

---

# Practice Statistics

Each word in the word bank tracks its own practice history.

The relevant fields are:

```text
success_attempts
failed_attempts
avg_success_attempts
last_attempted_at
```

When an exercise is successfully completed, the backend increments `success_attempts` and updates `avg_success_attempts`.

When an exercise is unsuccessful, `failed_attempts` is incremented.

The last attempt timestamp is updated for both outcomes.

---

# Dashboard Classification

The frontend transforms the user's word bank into four categories.

```text
                         ┌── Needs Review
                         │
Word Bank ───────────────┼── Getting There
                         │
                         ├── Strong
                         │
                         └── Not Attempted Yet
```

The current classification logic is:

### Not Attempted Yet

A word with no `last_attempted_at` value.

### Needs Review

A word where:

```text
avg_success_attempts > 2.0
```

or:

```text
success_attempts == 0
```

### Strong

A word where:

```text
avg_success_attempts <= 1.1
AND
success_attempts >= 20
```

### Getting There

Words that do not satisfy the other categories.

Words within the categories are sorted by `last_attempted_at` in ascending order.

---

# Word Bank API

The word bank router is mounted under:

```text
/wordbank
```

## Get Word Bank

```http
GET /wordbank
```

Returns the user's word bank along with practice statistics.

## Get Categories

```http
GET /wordbank/categories
```

Returns the user's word categories.

## Create Categories

```http
POST /wordbank/categories
```

Accepts a list of category names.

Example:

```json
[
  "Professional",
  "Conversation",
  "Writing"
]
```

## Add Word Phrases

```http
POST /wordbank/word-phrases
```

Accepts a mapping between category IDs and phrases.

Example:

```json
{
  "1": ["scramble", "meticulous"],
  "2": ["articulate", "concise"]
}
```

The backend converts these into database records before inserting them into the word bank.

## Update Categories

```http
PUT /wordbank/categories
```

Updates multiple category names using a Supabase RPC function.

## Delete Word Phrases

```http
DELETE /wordbank/word-phrases
```

Accepts a list of word IDs.

## Delete Categories

```http
DELETE /wordbank/categories
```

Accepts a list of category IDs.

---

# Vocabulary API

The vocabulary router is mounted under:

```text
/vocabulary
```

## Get Vocabulary

```http
GET /vocabulary
```

Returns the user's vocabulary collection.

The backend joins the user's vocabulary records with the corresponding vocabulary word information and returns cleaned objects containing:

```text
word_id
word
definition
example
word_level
```

## Get Vocabulary Dashboard

```http
GET /vocabulary/dashboard
```

Returns vocabulary words currently marked as active for the user's dashboard.

When there are no active words, the backend selects up to three new vocabulary words and marks them active.

## Add Vocabulary Word

```http
POST /vocabulary
```

Example:

```json
{
  "word_id": 123
}
```

## Delete Vocabulary Words

```http
DELETE /vocabulary
```

Accepts a list of word IDs to remove from the user's collection.

---

# User API

The user router is mounted under:

```text
/user
```

## Get User Configuration

```http
GET /user
```

Returns user configuration data such as the daily recall email setting.

## Update Daily Recall Email

```http
PUT /user/daily_recall_email/{is_daily_recall_email}
```

Example:

```http
PUT /user/daily_recall_email/true
```

The value is stored against the authenticated user's database record.

---

# Authentication API

The authentication router is mounted under:

```text
/auth
```

## Start Google Login

```http
GET /auth/login
```

Starts the Google OAuth flow.

## OAuth Callback

```http
GET /auth/callback
```

Receives the authorization code from the OAuth provider and establishes the user's application session.

## Check Authentication

```http
GET /auth/check
```

Returns authenticated user information when a valid session exists.

## Logout

```http
GET /auth/logout
```

Removes the user's application session and redirects to the frontend.

## Reset Practice Session

```http
PUT /auth/target-word-reset
```

Clears the current target word and all associated practice-session state.

---

# Frontend Structure

The frontend is organized around React components and route-level views.

```text
frontend/
├── public/
│   └── applogo.png
│
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── AppSidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Layout.tsx
│   │   ├── Loading.tsx
│   │   ├── Playground.tsx
│   │   ├── Settings.tsx
│   │   └── Vocabulary.tsx
│   │
│   ├── App.tsx
│   ├── api.tsx
│   ├── commons.tsx
│   └── ...
│
├── package.json
└── vite.config.ts
```

The main application uses React Router for navigation between the application's views.

The landing page provides Google authentication and introduces the application's core learning goals.

The Dashboard retrieves the user's word bank and organizes it into practice categories.

The Playground manages the interactive AI conversation and sends user responses to the FastAPI backend.

---

# Backend Structure

```text
backend/
├── main.py
├── database.py
├── models.py
├── prompts.py
├── userclient.py
├── requirements.txt
│
└── routers/
    ├── ai.py
    ├── auth.py
    ├── user.py
    ├── vocabulary.py
    └── wordbank.py
```

### `main.py`

Creates the FastAPI application, configures middleware, and registers the API routers.

### `database.py`

Creates the Supabase client using environment variables.

### `models.py`

Contains Pydantic models used for validating API requests and structuring application data.

### `prompts.py`

Contains the system prompt responsible for defining the AI vocabulary practice behavior.

### `userclient.py`

Creates an authenticated Supabase client using the user's session access token and handles access-token refreshes.

### `routers/ai.py`

Handles AI-powered vocabulary practice and updates practice statistics.

### `routers/auth.py`

Handles Google OAuth, application sessions, authentication checks, logout, and practice-session resets.

### `routers/wordbank.py`

Handles personal word categories and word phrases.

### `routers/vocabulary.py`

Handles the user's vocabulary collection and dashboard vocabulary.

### `routers/user.py`

Handles user-specific configuration.

---

# Data Flow

## Adding a Word

```text
User
 │
 │ Add word
 ▼
React
 │
 │ POST /wordbank/word-phrases
 ▼
FastAPI
 │
 │ Retrieve authenticated user
 ▼
Supabase
 │
 │ Insert word
 ▼
PostgreSQL
```

## Practicing a Word

```text
User selects word
       │
       ▼
React Playground
       │
       │ POST /ai/generate-word-context
       ▼
FastAPI
       │
       ├── Retrieve session
       ├── Retrieve target word
       ├── Build conversation
       │
       ▼
OpenAI
       │
       │ Generate situation/evaluation
       ▼
FastAPI
       │
       ├── Update session
       ├── Update practice statistics
       │
       ▼
React
       │
       ▼
Display AI response
```