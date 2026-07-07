import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createDocument, listDocuments, replaceDocumentChunks, updateDocumentStatus, updateDocumentStorageKey } from "@/lib/server/data-store";
import { chunkDocumentText, estimatePageCount, extractTextFromPdfBuffer } from "@/lib/server/pdf-processing";

const uploadsDirectory = path.join(process.cwd(), "uploads");
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a PDF file using the 'file' field." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "PDF uploads are limited to 20 MB." }, { status: 413 });
  }

  await mkdir(uploadsDirectory, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  const document = await createDocument({
    title: file.name.replace(/\.pdf$/i, ""),
    fileName: file.name,
    storageKey: "pending",
    mimeType: file.type || "application/pdf",
    size: file.size,
    pageCount: estimatePageCount(buffer),
    status: "processing",
    error: null,
  });
  const storageKey = path.join(uploadsDirectory, `${document.id}.pdf`);

  try {
    await writeFile(storageKey, buffer);
    await updateDocumentStorageKey(document.id, storageKey);
    const text = extractTextFromPdfBuffer(buffer);
    const chunks = chunkDocumentText(document.id, text);

    if (!chunks.length) {
      await updateDocumentStatus(document.id, "failed", "No extractable text was found in this PDF.");
      return NextResponse.json({ error: "No extractable text was found in this PDF.", document }, { status: 422 });
    }

    await replaceDocumentChunks(document.id, chunks);
    const readyDocument = await updateDocumentStatus(document.id, "ready");
    return NextResponse.json({ document: readyDocument, chunkCount: chunks.length }, { status: 201 });
  } catch (error) {
    await updateDocumentStatus(document.id, "failed", error instanceof Error ? error.message : "Unknown ingestion error");
    return NextResponse.json({ error: "Failed to ingest the PDF." }, { status: 500 });
  }
}
