export const architectureDecision = {
  app: "Full-stack Next.js with App Router",
  database: "Postgres with pgvector for relational data and embeddings",
  ai: "Streaming, citation-aware retrieval-augmented generation",
  design: "Clean SaaS workspace with document library, PDF viewer, chat, and citations",
} as const;

export const coreEntities = [
  "users",
  "documents",
  "document_chunks",
  "conversations",
  "messages",
  "citations",
] as const;
