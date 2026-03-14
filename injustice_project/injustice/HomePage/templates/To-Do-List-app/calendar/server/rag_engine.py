import chromadb
from chromadb.config import Settings
import os
import requests
import logging
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
CHROMA_DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")
OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

class RAGEngine:
    def __init__(self):
        self.client = None
        self.collection = None
        self._initialize_db()

    def _initialize_db(self):
        """Initialize ChromaDB client and collection."""
        try:
            # Using persistent storage
            self.client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
            
            # Create or get collection
            # We use a simple customized embedding function that calls Ollama
            self.collection = self.client.get_or_create_collection(
                name="calendar_knowledge",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"RAG Engine initialized. Database at: {CHROMA_DB_DIR}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")

    def _get_embedding(self, text):
        """Call Ollama to get embeddings for a text."""
        try:
            response = requests.post(
                OLLAMA_EMBED_URL,
                json={"model": EMBED_MODEL, "prompt": text},
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get("embedding")
            else:
                logger.error(f"Error getting embedding: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Exception getting embedding: {e}")
            return None

    def add_document(self, filename, content):
        """
        Chunk documents and add to vector DB.
        Simple chunking by paragraphs for now.
        """
        if not content.strip():
            return

        # Simple splitting by double newlines (paragraphs)
        chunks = [c.strip() for c in content.split('\n\n') if c.strip()]
        
        # Prepare data for Chroma
        ids = []
        embeddings = []
        documents = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            # We skip very short chunks
            if len(chunk) < 20:
                continue

            vector = self._get_embedding(chunk)
            if vector:
                chunk_id = f"{filename}_chunk_{i}"
                ids.append(chunk_id)
                embeddings.append(vector)
                documents.append(chunk)
                metadatas.append({"source": filename, "chunk_index": i})

        if ids:
            try:
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas
                )
                logger.info(f"Added {len(ids)} chunks from {filename}")
            except Exception as e:
                logger.error(f"Error upserting to Chroma: {e}")

    def scan_documents(self):
        """Scan the knowledge base directory for new files and ingest them."""
        if not os.path.exists(KNOWLEDGE_BASE_DIR):
            os.makedirs(KNOWLEDGE_BASE_DIR)
            return

        supported_exts = ['.txt', '.md']
        for root, _, files in os.walk(KNOWLEDGE_BASE_DIR):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in supported_exts:
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # In a real app, we'd check hash/modtime to avoid re-indexing
                        # For now, we just re-index on startup/request
                        self.add_document(file, content)
                    except Exception as e:
                        logger.error(f"Error reading {file}: {e}")

    def query(self, query_text, n_results=3):
        """Retrieve relevant context for a query."""
        if not self.collection:
            return []

        query_vector = self._get_embedding(query_text)
        if not query_vector:
            return []

        try:
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=n_results
            )
            # results['documents'] is a list of lists (one list per query)
            if results and results['documents']:
                return results['documents'][0]
            return []
        except Exception as e:
            logger.error(f"Error querying Chroma: {e}")
            return []

# Singleton instance
rag = RAGEngine()
