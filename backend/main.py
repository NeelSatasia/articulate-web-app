from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import user, wordbank, auth, ai
from dotenv import load_dotenv
import os
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
import redis.asyncio as redis
from limiter import limiter

load_dotenv()

SECRET_SESSION_KEY = os.getenv("SECRET_SESSION_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = redis.from_url(
        os.getenv("REDIS_URL"),
        decode_responses=True,
    )

    yield

    await app.state.redis.aclose()

app = FastAPI(lifespan=lifespan)

origins = [
    os.getenv("FRONTEND_URL")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_SESSION_KEY,
    https_only=True,
    same_site="none",
)

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

#routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(wordbank.router)
app.include_router(ai.router)


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)