from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import user, wordbank, auth, vocabulary, ai, prompts
from dotenv import load_dotenv
import os


load_dotenv()

SECRET_SESSION_KEY = os.getenv("SECRET_SESSION_KEY")

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=SECRET_SESSION_KEY, https_only=False)

#routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(wordbank.router)
app.include_router(vocabulary.router)
app.include_router(ai.router)
app.include_router(prompts.router)


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)