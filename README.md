# DocSpace

AI-powered document workspace that allows users to upload PDF documents,
search their content semantically, and ask questions using
Retrieval-Augmented Generation (RAG).

## Features

-   Upload and process PDF documents
-   Extract text from PDF files
-   Split documents into searchable chunks
-   Generate semantic embeddings using Hugging Face Transformers
-   Store and retrieve embeddings using Qdrant
-   Perform semantic document search
-   Gemini-powered RAG question answering
-   REST API backend using Express.js
-   Next.js + TypeScript frontend
-   Responsive document workspace UI
-   Duplicate document replacement using filename-based filtering

## Architecture

``` text
                         DOCUMENT INGESTION

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
     │
     │                    QUERY PIPELINE
     │
     │              User Question
     │                   │
     │                   ▼
     │            Query Embedding
     │                   │
     │                   ▼
     └────────────► Semantic Retrieval
                          │
                          ▼
                    Relevant Chunks
                          │
                          ▼
                      Gemini LLM
                          │
                          ▼
                       AI Answer
```

## Tech Stack

### Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS

### Backend

-   Node.js
-   Express.js
-   REST APIs
-   Multer
-   PDF.js

### AI / RAG

-   Google Gemini
-   Hugging Face Transformers
-   `Xenova/all-MiniLM-L6-v2`

### Vector Database

-   Qdrant

### Development Tools

-   Git
-   GitHub
-   VS Code
-   npm

## How It Works

### 1. Document Upload

The user uploads a PDF through the Next.js frontend.

The file is sent to the Express backend through a REST API.

### 2. PDF Processing

The backend extracts text from the PDF using PDF.js.

The extracted text is divided into smaller chunks for efficient
retrieval.

### 3. Embedding Generation

Each text chunk is converted into a numerical vector using:

``` text
Xenova/all-MiniLM-L6-v2
```

The model generates 384-dimensional embeddings.

### 4. Vector Storage

The embeddings and document metadata are stored in a Qdrant collection
using cosine similarity.

Each vector contains metadata such as:

-   Filename
-   Text chunk
-   Chunk index

### 5. Semantic Search

When the user asks a question, the question is converted into an
embedding using the same embedding model.

Qdrant performs similarity search and retrieves the most relevant
document chunks.

### 6. RAG Generation

The retrieved chunks are provided as context to Gemini.

Gemini generates an answer using the retrieved document context rather
than relying only on its general knowledge.

``` text
User Question
      ↓
Query Embedding
      ↓
Qdrant Similarity Search
      ↓
Top Relevant Chunks
      ↓
Context + Question
      ↓
Gemini
      ↓
Generated Answer
```

## Project Structure

``` text
DocSpace/
│
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   └── embeddings.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   └── app/
│   │       └── page.tsx
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## API Endpoints

  Method   Endpoint                  Description
  -------- ------------------------- ----------------------------------
  `GET`    `/`                       Check API status
  `POST`   `/api/documents/upload`   Upload and index a PDF
  `POST`   `/api/search`             Perform semantic document search
  `POST`   `/api/chat`               Ask questions using RAG

## API Flow

### Upload Document

``` text
Frontend
   │
   │ POST /api/documents/upload
   ▼
Express Backend
   │
   ├── Extract PDF text
   ├── Create chunks
   ├── Generate embeddings
   └── Store vectors
          │
          ▼
       Qdrant
```

### Ask Question

``` text
Frontend
   │
   │ POST /api/chat
   ▼
Express Backend
   │
   ├── Embed query
   ├── Search Qdrant
   ├── Retrieve relevant chunks
   └── Send context to Gemini
          │
          ▼
       AI Answer
```

## Setup

### Prerequisites

Make sure you have:

-   Node.js
-   npm
-   A Qdrant Cloud account
-   A Google Gemini API key

### 1. Clone the Repository

``` bash
git clone https://github.com/tamrind69/DocSpace.git
cd DocSpace
```

### 2. Setup Backend

``` bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

``` env
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

``` bash
node src/server.js
```

The backend runs on:

``` text
http://localhost:5000
```

### 3. Setup Frontend

Open a new terminal:

``` bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

``` text
http://localhost:3000
```

Open the application in your browser:

``` text
http://localhost:3000
```

## Environment Variables

  Variable           Description
  ------------------ ---------------------------
  `QDRANT_URL`       Qdrant Cloud cluster URL
  `QDRANT_API_KEY`   Qdrant authentication key
  `GEMINI_API_KEY`   Google Gemini API key

> Never commit API keys or `.env` files to GitHub.

## Vector Database Configuration

DocSpace uses a Qdrant collection named:

``` text
documents
```

The collection uses:

``` text
Vector Size: 384
Distance: Cosine
```

Document metadata is stored alongside each vector to allow retrieved
chunks to be associated with their source document.

## RAG Pipeline

DocSpace follows a standard Retrieval-Augmented Generation architecture:

``` text
                  ┌─────────────────┐
                  │   PDF Document  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Text Extraction│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    Chunking     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Embeddings    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │     Qdrant      │
                  └────────┬────────┘
                           │
                    User Question
                           │
                           ▼
                  ┌─────────────────┐
                  │ Query Embedding │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Similarity Search│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Relevant Context│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Gemini LLM     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    AI Answer    │
                  └─────────────────┘
```

## Future Improvements

-   Multi-document selection
-   Document management interface
-   Conversation history
-   Streaming AI responses
-   Source citations in generated answers
-   Improved chunking strategies
-   Authentication and user accounts
-   Persistent chat sessions
-   Document deletion from the UI

## Author

**Raj Singh**

-   GitHub: https://github.com/tamrind69
