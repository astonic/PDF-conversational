"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CitationRecord, DocumentRecord, MessageRecord } from "@/lib/types";

type ChatState = {
  messages: MessageRecord[];
  citationsByMessageId: Record<string, CitationRecord[]>;
};

export function PdfConversationApp() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatState>({ messages: [], citationsByMessageId: {} });
  const [question, setQuestion] = useState("");
  const [uploadState, setUploadState] = useState("Choose a PDF to start.");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null,
    [documents, selectedDocumentId],
  );

  async function loadDocuments() {
    const response = await fetch("/api/documents", { cache: "no-store" });
    const payload = (await response.json()) as { documents: DocumentRecord[] };
    setDocuments(payload.documents);
    setSelectedDocumentId((current) => current ?? payload.documents[0]?.id ?? null);
  }

  async function loadChat(documentId: string) {
    const response = await fetch(`/api/chat?documentId=${encodeURIComponent(documentId)}`, { cache: "no-store" });
    const payload = (await response.json()) as ChatState;
    setChat({ messages: payload.messages ?? [], citationsByMessageId: payload.citationsByMessageId ?? {} });
  }

  useEffect(() => {
    void loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedDocument?.id) void loadChat(selectedDocument.id);
  }, [selectedDocument?.id]);

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsUploading(true);
    setUploadState("Uploading and indexing PDF…");

    try {
      const response = await fetch("/api/documents", { method: "POST", body: formData });
      const payload = await response.json();

      if (!response.ok) {
        setUploadState(payload.error ?? "Upload failed.");
        return;
      }

      setUploadState(`Indexed ${payload.chunkCount} chunks. You can ask questions now.`);
      form.reset();
      await loadDocuments();
      setSelectedDocumentId(payload.document.id);
    } finally {
      setIsUploading(false);
    }
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDocument || !question.trim()) return;

    setIsAsking(true);
    const currentQuestion = question.trim();
    setQuestion("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocument.id, question: currentQuestion }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setChat((current) => ({
          ...current,
          messages: [
            ...current.messages,
            {
              id: crypto.randomUUID(),
              conversationId: "local-error",
              role: "assistant",
              content: payload.error ?? "Unable to answer right now.",
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return;
      }

      await loadChat(selectedDocument.id);
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-slate-200 bg-white/90 px-5 py-3 shadow-sm">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">PDF Conversational</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">MVP features enabled</span>
        </nav>

        <header className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">Ask PDFs with citations</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Upload a PDF, ask questions, verify sources.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
              This MVP validates PDFs, extracts text, chunks content, creates local embeddings, retrieves relevant context,
              and stores citation-backed answers.
            </p>
          </div>

          <form className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={uploadDocument}>
            <label className="block text-sm font-semibold text-ink" htmlFor="file">
              Upload PDF
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                accept="application/pdf,.pdf"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                id="file"
                name="file"
                required
                type="file"
              />
              <button
                className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUploading}
                type="submit"
              >
                {isUploading ? "Indexing…" : "Upload"}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">{uploadState}</p>
          </form>
        </header>

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Document library</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-muted">{documents.length} PDFs</span>
            </div>
            <div className="space-y-3">
              {documents.length ? (
                documents.map((document) => (
                  <button
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedDocument?.id === document.id ? "border-brand bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    key={document.id}
                    onClick={() => setSelectedDocumentId(document.id)}
                    type="button"
                  >
                    <span className="block truncate text-sm font-semibold">{document.title}</span>
                    <span className="mt-2 block text-xs capitalize text-muted">
                      {document.status} · {Math.round(document.size / 1024)} KB
                    </span>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-muted">
                  No PDFs yet. Upload a file to create a searchable document workspace.
                </p>
              )}
            </div>
          </aside>

          <section className="grid min-h-[620px] gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">PDF context</h2>
                  <p className="mt-1 text-sm text-slate-300">{selectedDocument?.fileName ?? "Select a document"}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">{selectedDocument?.status ?? "empty"}</span>
              </div>
              <div className="space-y-3 rounded-2xl bg-white/5 p-4">
                <p className="text-sm leading-6 text-slate-300">
                  {selectedDocument
                    ? "The indexed text is searched by local embeddings. Retrieved snippets appear as citations beside assistant answers."
                    : "Upload a PDF to populate this panel with document metadata and searchable context."}
                </p>
                {selectedDocument ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <dt className="text-slate-400">Pages</dt>
                      <dd className="mt-1 font-semibold">{selectedDocument.pageCount ?? "Estimated after parsing"}</dd>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-3">
                      <dt className="text-slate-400">Stored</dt>
                      <dd className="mt-1 font-semibold">{new Date(selectedDocument.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>
            </article>

            <article className="flex rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex min-h-0 flex-1 flex-col p-5">
                <h2 className="text-lg font-semibold">Conversation</h2>
                <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4">
                  {chat.messages.length ? (
                    chat.messages.map((message) => (
                      <div key={message.id}>
                        <div
                          className={`rounded-2xl p-4 text-sm leading-6 ${
                            message.role === "user" ? "ml-auto bg-slate-900 text-white" : "bg-indigo-50 text-indigo-950"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {chat.citationsByMessageId[message.id]?.length ? (
                          <div className="mt-2 space-y-2">
                            {chat.citationsByMessageId[message.id].map((citation) => (
                              <div className="rounded-xl border border-indigo-100 bg-white p-3 text-xs text-muted" key={citation.id}>
                                <strong className="text-ink">Source score {citation.score}</strong>
                                <p className="mt-1 line-clamp-3">{citation.quote}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-white p-4 text-sm leading-6 text-muted">
                      Ask a question after selecting a ready document. Answers will include retrieved source snippets.
                    </p>
                  )}
                </div>
                <form className="mt-4 flex gap-3" onSubmit={askQuestion}>
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    disabled={!selectedDocument || selectedDocument.status !== "ready" || isAsking}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask about clauses, risks, summaries, obligations…"
                    value={question}
                  />
                  <button
                    className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!selectedDocument || selectedDocument.status !== "ready" || isAsking}
                    type="submit"
                  >
                    {isAsking ? "Asking…" : "Ask"}
                  </button>
                </form>
              </div>
            </article>
          </section>
        </section>
      </section>
    </main>
  );
}
