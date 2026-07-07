# PDF Conversational

PDF Conversational is a full-stack Next.js MVP for uploading PDFs, indexing their contents, and chatting with documents using citation-aware retrieval.

## Built features

- **PDF upload and validation:** Upload PDF files through the web UI or `POST /api/documents`; uploads are limited to 20 MB and non-PDF files are rejected.
- **Local document storage:** Uploaded PDFs are stored under `uploads/`, while MVP application records are stored in `.data/app-data.json` for local development.
- **Text extraction and chunking:** The server extracts readable text from simple text-based PDFs, chunks content with overlap, and records chunk metadata.
- **Local embeddings and retrieval:** Chunks and questions are embedded with a deterministic local embedding function so the MVP can retrieve relevant snippets without an external API key.
- **Citation-aware chat:** `POST /api/chat` stores user and assistant messages, retrieves relevant chunks, generates a grounded extractive answer, and stores citations.
- **Interactive workspace UI:** The homepage includes PDF upload, document library, document context panel, chat input, conversation history, and source snippets.
- **Database-ready schema:** `db/migrations/0001_initial_schema.sql` defines the intended Postgres + pgvector schema for production persistence.

## Architecture baseline

- **Application:** Next.js App Router with TypeScript.
- **Design:** Clean SaaS workspace with a document library, split PDF/chat view, and citation panel.
- **MVP persistence:** Local JSON data store for fast local iteration.
- **Production persistence target:** Postgres for application data plus pgvector for document chunk embeddings.
- **AI flow:** Upload PDF, parse pages, chunk text, embed chunks, retrieve relevant context, store messages, and display citations.

## Initial repository structure

```text
src/app/                 Next.js routes, pages, layout, and global styles
src/components/          Interactive client UI components
src/lib/                 Shared types, architecture constants, and server utilities
db/migrations/           SQL migrations for Postgres and pgvector
docs/                    Architecture notes and implementation plans
scripts/                 Lightweight repository checks
```

## Getting started

1. Copy `.env.example` to `.env.local` and fill in values if you want to connect external services later.
2. Install dependencies with `npm install`.
3. Start the development server with `npm run dev`.
4. Open `http://localhost:3000`, upload a text-based PDF, and ask questions about it.

> Dependency installation requires access to the public npm registry. In restricted environments, install/build commands may fail before the app can run.

## API routes

### `GET /api/documents`

Returns uploaded document records sorted by newest first.

### `POST /api/documents`

Accepts multipart form data with a `file` field containing a PDF. The route validates the upload, stores the file, extracts text, chunks content, creates local embeddings, and marks the document as ready or failed.

### `GET /api/chat?documentId=...`

Returns the current conversation, messages, and citations for a document.

### `POST /api/chat`

Accepts JSON with `documentId` and `question`. The route stores the question, retrieves relevant chunks, creates an extractive answer, stores assistant citations, and returns the saved messages and citations.

## Build plan status

1. ✅ Scaffold the Next.js app shell and design direction.
2. ✅ Add the database schema for users, documents, chunks, conversations, messages, and citations.
3. ✅ Implement PDF ingestion with validation, parsing, chunking, and local embeddings.
4. ✅ Implement retrieval and chat APIs with citation persistence.
5. ✅ Build the document library, PDF context panel, chat workspace, and citation experience.
6. ⏳ Add production Postgres repository, authentication, robust PDF parsing/OCR, streaming LLM responses, automated tests, and deployment guidance.
