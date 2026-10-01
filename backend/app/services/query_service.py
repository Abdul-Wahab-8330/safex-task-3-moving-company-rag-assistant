# backend/app/services/query_service.py
from google import genai
from google.genai import types
from pinecone import Pinecone
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

def ask_moving_assistant(user_query: str) -> str:
    """Searches Pinecone policies and generates an AI response using Gemini."""
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index = pc.Index(settings.PINECONE_INDEX_NAME)

    # 1. Embed the user's question
    query_response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=user_query,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    query_vector = query_response.embeddings[0].values

    # 2. Search Pinecone for the top 3 matching policy chunks
    search_results = index.query(
        vector=query_vector,
        top_k=3,
        include_metadata=True
    )

    # 3. Extract the retrieved policy text
    retrieved_texts = []
    for match in search_results.matches:
        if match.metadata and "text" in match.metadata:
            retrieved_texts.append(match.metadata["text"])

    context = "\n\n---\n\n".join(retrieved_texts)

    # 4. Construct the prompt for Gemini to answer based on policy context
    prompt = f"""
    You are a helpful and professional customer service AI assistant for a moving and relocation business.
    Answer the user's question accurately using ONLY the provided company policy context below. 
    If the answer cannot be found in the context, politely let them know and invite them to contact support.

    Company Policy Context:
    {context}

    User Question: {user_query}

    Assistant Response:
    """

    # 5. Generate the final answer using Gemini chat model
    chat_response = client.models.generate_content(
        model="gemini-3.1-flash-lite", 
        contents=prompt
    )

    return chat_response.text