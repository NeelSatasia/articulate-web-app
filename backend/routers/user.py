from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.concurrency import run_in_threadpool
from userclient import get_user_client

router = APIRouter(prefix="/user", tags=["User"])
