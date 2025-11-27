import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users
from routers import wordbank

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

#routers
app.include_router(users.router)
app.include_router(wordbank.router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)