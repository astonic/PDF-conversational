import type { DocumentChunk } from "@/lib/types";
import { createEmbedding } from "@/lib/server/embeddings";

const MAX_CHUNK_CHARACTERS = 900;
const CHUNK_OVERLAP_CHARACTERS = 120;

export function extractTextFromPdfBuffer(buffer: Buffer) {
  const raw = buffer.toString("latin1");
  const textOperators = [...raw.matchAll(/\(([^()]{2,})\)\s*Tj/g)].map((match) => match[1]);
  const arrayOperators = [...raw.matchAll(/\[((?:\([^()]*\)\s*)+)\]\s*TJ/g)].map((match) =>
    [...match[1].matchAll(/\(([^()]*)\)/g)].map((part) => part[1]).join(" "),
  );
  const extracted = [...textOperators, ...arrayOperators]
    .join(" ")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (extracted.length > 80) return extracted;

  return raw
    .replace(/[^\x20-\x7E\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimatePageCount(buffer: Buffer) {
  const raw = buffer.toString("latin1");
  const matches = raw.match(/\/Type\s*\/Page\b/g);
  return matches?.length ?? null;
}

export function chunkDocumentText(documentId: string, text: string): Omit<DocumentChunk, "id" | "createdAt">[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: Omit<DocumentChunk, "id" | "createdAt">[] = [];
  let start = 0;

  while (start < normalized.length) {
    const hardEnd = Math.min(start + MAX_CHUNK_CHARACTERS, normalized.length);
    const sentenceEnd = normalized.lastIndexOf(".", hardEnd);
    const end = sentenceEnd > start + 240 ? sentenceEnd + 1 : hardEnd;
    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        documentId,
        chunkIndex: chunks.length,
        pageNumber: null,
        content,
        embedding: createEmbedding(content),
        metadata: { extractor: "built-in-naive-pdf-text", characters: content.length },
      });
    }

    if (end >= normalized.length) break;
    start = Math.max(end - CHUNK_OVERLAP_CHARACTERS, start + 1);
  }

  return chunks;
}
