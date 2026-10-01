# backend/app/services/pinecone_service.py
import os
from google import genai
from google.genai import types
from pinecone import Pinecone, ServerlessSpec
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def init_pinecone_index():
    """Initializes Pinecone client and ensures the index exists."""
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_INDEX_NAME

    existing_indexes = [index.name for index in pc.list_indexes()]
    if index_name not in existing_indexes:
        print(f"Creating Pinecone index: {index_name}...")
        pc.create_index(
            name=index_name,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    return pc.Index(index_name)

def get_embedding(text: str) -> list:
    """Generates vector embeddings using the modern google-genai client."""
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    return response.embeddings[0].values

def ingest_policies():
    """Reads the company policy file, chunks it, embeds it, and upserts to Pinecone."""
    policy_file_path = os.path.join(os.path.dirname(__file__), "../data/company_policies.txt")
    
    if not os.path.exists(policy_file_path):
        return {"error": "Policy file not found!"}

    with open(policy_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    sections = content.split("## ")
    chunks = []
    for section in sections:
        if section.strip():
            chunks.append("## " + section.strip())

    index = init_pinecone_index()
    vectors_to_upsert = []

    print(f"Processing {len(chunks)} policy sections for vectorization...")
    for i, chunk in enumerate(chunks):
        vector_id = f"policy-chunk-{i}"
        embedding = get_embedding(chunk)
        
        vectors_to_upsert.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {"text": chunk}
        })

    index.upsert(vectors=vectors_to_upsert)
    return {"status": "success", "message": f"Successfully vectorized and uploaded {len(chunks)} policy chunks to Pinecone!"}