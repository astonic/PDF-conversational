export type ProcessingStatus = "pending" | "processing" | "ready" | "failed";

export type DocumentRecord = {
  id: string;
  title: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  pageCount: number | null;
  status: ProcessingStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentChunk = {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number | null;
  content: string;
  embedding: number[];
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type ConversationRecord = {
  id: string;
  documentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageRole = "user" | "assistant" | "system";

export type MessageRecord = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
};

export type CitationRecord = {
  id: string;
  messageId: string;
  chunkId: string | null;
  documentId: string;
  pageNumber: number | null;
  quote: string;
  score: number;
  createdAt: string;
};

export type AppData = {
  documents: DocumentRecord[];
  chunks: DocumentChunk[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  citations: CitationRecord[];
};
