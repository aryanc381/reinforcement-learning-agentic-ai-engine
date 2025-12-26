from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

app = FastAPI()

class TextIn(BaseModel):
    text: str

@app.post("/embed")
def embed_text(payload: TextIn):
    embedding = model.encode(payload.text)
    return {
        "embedding": embedding.tolist(),
        "length": len(embedding)
    }
