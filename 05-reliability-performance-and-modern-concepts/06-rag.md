# RAG (Retrieval-Augmented Generation)

> **In one line:** Improves an LLM's answers by retrieving relevant external knowledge as context.

## Overview

RAG is an architecture that improves the answers of a language model by retrieving relevant information from an external knowledge base and providing it as context. Instead of relying solely on what the model learned during training, the system fetches up-to-date or domain-specific information at query time.

## Key Idea

The pipeline has two phases:

- **Ingestion:** documents are chunked, converted to embeddings, and stored in a vector database.
- **Query time:** the question is embedded and used to search the vector database for relevant chunks, which are included in the prompt sent to the model.

## Trade-offs & Considerations

- The model generates an answer **grounded in the retrieved context** rather than hallucinating from general training knowledge.

---

_Notes: (add your own content here)_
