import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentStudentPortalSession } from "@/lib/auth";
import { createDocument, logAudit } from "@/lib/data";
import { readLocalDb, writeLocalDb } from "@/lib/local-store";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/jpg"]);
const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

export async function POST(request: Request) {
  try {
    const session = await getCurrentStudentPortalSession();
    if (!session) {
      return NextResponse.json({ error: "Portal session expired." }, { status: 401 });
    }

    const formData = await request.formData();
    const documentType = String(formData.get("document_type") ?? "");
    const file = formData.get("document");

    if (!documentType) {
      return NextResponse.json({ error: "Document type is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Document file is required." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.has(ext) || !allowedMimeTypes.has(file.type || "")) {
      return NextResponse.json({ error: "Invalid file type. Please upload PDF or images." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${crypto.randomUUID()}-${Date.now()}${ext}`;
    const target = path.join(uploadDir, safeName);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(target, bytes);

    const document = await createDocument({
      student_id: session.student_id,
      document_type: documentType,
      original_filename: file.name,
      file_url: `/uploads/documents/${safeName}`,
      file_size: file.size
    });

    await logAudit({
      action: "Document Uploaded (Student Portal)",
      table_name: "student_documents",
      related_id: document.id,
      record_label: session.full_name,
      new_value: JSON.stringify({ document_type: documentType, file: file.name })
    });

    try {
      const db = await readLocalDb();
      db.portal_activity.unshift({
        id: crypto.randomUUID(),
        student_id: session.student_id,
        activity_type: "document_upload",
        activity_details: `${documentType}: ${file.name}`,
        created_at: new Date().toISOString()
      });
      await writeLocalDb(db);
    } catch {
      // Local activity tracking is best-effort when using the local data store.
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
