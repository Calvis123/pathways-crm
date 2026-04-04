import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createDocument } from "@/lib/data";

const schema = z.object({
  student_id: z.string().uuid(),
  document_type: z.string().min(2)
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("document");
    const parsed = schema.parse({
      student_id: formData.get("student_id"),
      document_type: formData.get("document_type")
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Document file is required." }, { status: 400 });
    }

    const allowedExt = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"]);
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExt.has(ext)) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    if (/\.(php|phtml|php3|php4|php5|php7|phps)$/i.test(file.name)) {
      return NextResponse.json({ error: "Invalid file type." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = file.type;
    const allowedMimes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png"
    ]);

    if (!allowedMimes.has(mimeType)) {
      return NextResponse.json({ error: "File content does not match a valid file type." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });
    const safeName = `doc_${randomUUID()}${ext}`;
    const target = path.join(uploadDir, safeName);
    await writeFile(target, bytes);

    const document = await createDocument({
      student_id: parsed.student_id,
      document_type: parsed.document_type,
      original_filename: file.name,
      file_url: `/uploads/documents/${safeName}`,
      file_size: file.size
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
