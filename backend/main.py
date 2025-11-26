import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

origins = [
    "http://localhost:5173"
]

class Object(BaseModel):
    name: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

objects = ['obj1', "obj2"]

@app.get("/objects", response_model=list)
def read_objects():
    return objects

@app.post("/new_object", response_model=str)
def add_person(obj: Object):
    objects.append(obj)
    return obj.name + " is added!"


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)