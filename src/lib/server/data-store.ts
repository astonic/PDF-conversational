import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AppData,
  CitationRecord,
  ConversationRecord,
  DocumentChunk,
  DocumentRecord,
  MessageRecord,
  ProcessingStatus,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "app-data.json");

const emptyData = (): AppData => ({
  documents: [],
  chunks: [],
  conversations: [],
  messages: [],
  citations: [],
});

async function readData(): Promise<AppData> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return { ...emptyData(), ...JSON.parse(raw) } as AppData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyData();
    }
    throw error;
  }
}

async function writeData(data: AppData) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function listDocuments() {
  const data = await readData();
  return [...data.documents].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getDocument(documentId: string) {
  const data = await readData();
  return data.documents.find((document) => document.id === documentId) ?? null;
}

export async function createDocument(input: Omit<DocumentRecord, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const document: DocumentRecord = { id: randomUUID(), createdAt: now, updatedAt: now, ...input };
  const data = await readData();
  data.documents.push(document);
  await writeData(data);
  return document;
}

export async function updateDocumentStatus(documentId: string, status: ProcessingStatus, error: string | null = null) {
  const data = await readData();
  const document = data.documents.find((candidate) => candidate.id === documentId);
  if (!document) return null;
  document.status = status;
  document.error = error;
  document.updatedAt = new Date().toISOString();
  await writeData(data);
  return document;
}

export async function replaceDocumentChunks(documentId: string, chunks: Omit<DocumentChunk, "id" | "createdAt">[]) {
  const data = await readData();
  data.chunks = data.chunks.filter((chunk) => chunk.documentId !== documentId);
  const now = new Date().toISOString();
  const storedChunks = chunks.map((chunk) => ({ ...chunk, id: randomUUID(), createdAt: now }));
  data.chunks.push(...storedChunks);
  await writeData(data);
  return storedChunks;
}

export async function listDocumentChunks(documentId: string) {
  const data = await readData();
  return data.chunks
    .filter((chunk) => chunk.documentId === documentId)
    .sort((left, right) => left.chunkIndex - right.chunkIndex);
}

export async function getOrCreateConversation(documentId: string) {
  const data = await readData();
  const existing = data.conversations.find((conversation) => conversation.documentId === documentId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const conversation: ConversationRecord = {
    id: randomUUID(),
    documentId,
    title: "Document conversation",
    createdAt: now,
    updatedAt: now,
  };
  data.conversations.push(conversation);
  await writeData(data);
  return conversation;
}

export async function addMessage(input: Omit<MessageRecord, "id" | "createdAt">) {
  const data = await readData();
  const message: MessageRecord = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  data.messages.push(message);
  const conversation = data.conversations.find((candidate) => candidate.id === input.conversationId);
  if (conversation) conversation.updatedAt = message.createdAt;
  await writeData(data);
  return message;
}

export async function listMessages(conversationId: string) {
  const data = await readData();
  return data.messages
    .filter((message) => message.conversationId === conversationId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function addCitations(citations: Omit<CitationRecord, "id" | "createdAt">[]) {
  const data = await readData();
  const now = new Date().toISOString();
  const storedCitations = citations.map((citation) => ({ ...citation, id: randomUUID(), createdAt: now }));
  data.citations.push(...storedCitations);
  await writeData(data);
  return storedCitations;
}

export async function listCitations(messageId: string) {
  const data = await readData();
  return data.citations.filter((citation) => citation.messageId === messageId);
}

export async function updateDocumentStorageKey(documentId: string, storageKey: string) {
  const data = await readData();
  const document = data.documents.find((candidate) => candidate.id === documentId);
  if (!document) return null;
  document.storageKey = storageKey;
  document.updatedAt = new Date().toISOString();
  await writeData(data);
  return document;
}
