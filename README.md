# DocSpace

AI-powered document workspace that lets users upload PDF documents, search their content semantically, and ask questions using Retrieval-Augmented Generation (RAG).

## Features

- Upload and process PDF documents
- Extract text from PDFs
- Split documents into searchable chunks
- Generate semantic embeddings using Hugging Face
- Store and retrieve vectors using Qdrant
- Semantic document search
- Gemini-powered RAG question answering
- REST API backend
- Next.js + TypeScript frontend
- Responsive document workspace UI

## Architecture

```text
PDF Document
     │
     ▼
PDF Text Extraction
     │
     ▼
Text Chunking
     │
     ▼
Hugging Face Embeddings
     │
     ▼
Qdrant Vector Database
     │
     ▼
Semantic Retrieval
     │
     ▼
Gemini LLM
     │
     ▼
AI Answer