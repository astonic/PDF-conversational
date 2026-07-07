# Architecture Plan

## Product direction

The first version is a clean SaaS-style application that lets users upload PDFs, inspect documents, ask questions, and verify answers with source citations.

## Technical decisions

| Area | Decision | Rationale |
| --- | --- | --- |
| Web app | Full-stack Next.js App Router | Keeps UI and API work in one deployable TypeScript project. |
| MVP storage | Local JSON store plus uploaded files | Allows the product loop to run locally without provisioning infrastructure. |
| Production storage | Postgres + pgvector | Stores relational app data and embeddings in one production-ready database. |
| UI | Split document/chat workspace | Keeps generated answers grounded in visible source material. |
| Retrieval | Chunk-level vector search with citation records | Enables traceability from each answer back to document pages and chunks. |

## Implemented workflows

1. User uploads a PDF through the homepage.
2. The app validates file type and size through `POST /api/documents`.
3. The server stores the original file in `uploads/`.
4. The server extracts readable PDF text with a built-in parser for text-based PDFs.
5. Extracted text is chunked with overlap and embedded using deterministic local embeddings.
6. User asks a question in the document conversation.
7. The chat API retrieves relevant chunks, creates an extractive grounded answer, stores messages, and stores citations.
8. The UI displays answer text alongside retrieved source snippets and scores.

## Next production hardening steps

- Replace the local JSON store with a repository backed by the Postgres + pgvector migration.
- Add authentication and per-user authorization checks.
- Replace naive PDF extraction with a robust parser and OCR fallback.
- Replace extractive local answers with streamed LLM responses grounded in retrieved chunks.
- Add automated API, component, and retrieval tests.
- Add deployment documentation and background job processing for large PDFs.

## Context management notes

- Keep architecture decisions documented here as they evolve.
- Treat the plan as the source of truth before implementing large features.
- Prefer narrow implementation slices: schema, ingestion, retrieval, then UI integration.
