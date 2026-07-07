import type { CitationRecord, DocumentChunk } from "@/lib/types";
import { createEmbedding, cosineSimilarity } from "@/lib/server/embeddings";
import { listDocumentChunks } from "@/lib/server/data-store";

export type RetrievedChunk = DocumentChunk & { score: number };

export async function retrieveRelevantChunks(documentId: string, question: string, limit = 5): Promise<RetrievedChunk[]> {
  const questionEmbedding = createEmbedding(question);
  const chunks = await listDocumentChunks(documentId);

  return chunks
    .map((chunk) => ({ ...chunk, score: cosineSimilarity(questionEmbedding, chunk.embedding) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function buildExtractiveAnswer(question: string, chunks: RetrievedChunk[]) {
  if (!chunks.length) {
    return "I could not find relevant content in this document yet. Try uploading a text-based PDF or asking a broader question.";
  }

  const highlights = chunks.slice(0, 3).map((chunk, index) => {
    const page = chunk.pageNumber ? `page ${chunk.pageNumber}` : `chunk ${chunk.chunkIndex + 1}`;
    return `${index + 1}. ${summarizeChunk(chunk.content)} (${page}).`;
  });

  return [
    `Based on the retrieved document context, here is the best grounded answer to: “${question}”`,
    "",
    ...highlights,
    "",
    "Review the cited source snippets before relying on this answer for important decisions.",
  ].join("\n");
}

export function chunksToCitationInputs(
  documentId: string,
  messageId: string,
  chunks: RetrievedChunk[],
): Omit<CitationRecord, "id" | "createdAt">[] {
  return chunks.map((chunk) => ({
    messageId,
    chunkId: chunk.id,
    documentId,
    pageNumber: chunk.pageNumber,
    quote: summarizeChunk(chunk.content, 260),
    score: Number(chunk.score.toFixed(4)),
  }));
}

function summarizeChunk(content: string, maxLength = 320) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}
