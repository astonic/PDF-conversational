import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addCitations,
  addMessage,
  getDocument,
  getOrCreateConversation,
  listCitations,
  listMessages,
} from "@/lib/server/data-store";
import { buildExtractiveAnswer, chunksToCitationInputs, retrieveRelevantChunks } from "@/lib/server/retrieval";

const chatRequestSchema = z.object({
  documentId: z.string().min(1),
  question: z.string().min(1).max(2000),
});

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a documentId and question." }, { status: 400 });
  }

  const { documentId, question } = parsed.data;
  const document = await getDocument(documentId);

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (document.status !== "ready") {
    return NextResponse.json({ error: "Document is not ready for chat yet." }, { status: 409 });
  }

  const conversation = await getOrCreateConversation(documentId);
  const userMessage = await addMessage({ conversationId: conversation.id, role: "user", content: question });
  const retrievedChunks = await retrieveRelevantChunks(documentId, question);
  const answer = buildExtractiveAnswer(question, retrievedChunks);
  const assistantMessage = await addMessage({ conversationId: conversation.id, role: "assistant", content: answer });
  const citations = await addCitations(chunksToCitationInputs(documentId, assistantMessage.id, retrievedChunks));

  return NextResponse.json({ conversation, userMessage, assistantMessage, citations });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required." }, { status: 400 });
  }

  const conversation = await getOrCreateConversation(documentId);
  const messages = await listMessages(conversation.id);
  const citationsByMessageId = Object.fromEntries(
    await Promise.all(messages.map(async (message) => [message.id, await listCitations(message.id)] as const)),
  );

  return NextResponse.json({ conversation, messages, citationsByMessageId });
}
