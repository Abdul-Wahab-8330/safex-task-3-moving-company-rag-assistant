# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.pinecone_service import ingest_policies
from app.services.query_service import ask_moving_assistant

# Initialize FastAPI
app = FastAPI(
    title="Residential Moving Assistant API",
    version="1.0.0",
    description="Professional AI-powered backend for family-owned moving relocation service."
)

# Configure CORS to allow requests from anywhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body schema for chat query
class QueryRequest(BaseModel):
    question: str
    
class DistanceRequest(BaseModel):
    origin: str
    destination: str
    

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Moving Assistant FastAPI Backend is running smoothly with global CORS!"
    }

@app.post("/api/ingest-policies")
async def run_policy_ingestion():
    result = ingest_policies()
    return result

@app.post("/api/ask")
async def ask_assistant(payload: QueryRequest):
    """Endpoint for customers/users to ask relocation questions answered via Pinecone RAG + Gemini."""
    try:
        answer = ask_moving_assistant(payload.question)
        return {"status": "success", "question": payload.question, "answer": answer}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
