from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import users, wordbank, auth


SECRET_SESSION_KEY = "random_secret_string_for_session_encryption"

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

app.add_middleware(SessionMiddleware, secret_key=SECRET_SESSION_KEY)

#routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(wordbank.router)


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)