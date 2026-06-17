import type { DocumentRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

const tones: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  uploaded: "bg-sky-100 text-sky-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800"
};

export function DocumentsTable({ documents }: { documents: DocumentRecord[] }) {
  return (
    <Card>
      <CardHeader title="Documents" description="This replaces the legacy upload/review flow with metadata ready for Supabase Storage." />
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#f0dfd0] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-b border-slate-50">
                <td className="px-4 py-4">{document.student?.full_name ?? document.student_id}</td>
                <td className="px-4 py-4">{document.document_type}</td>
                <td className="px-4 py-4">{document.original_filename}</td>
                <td className="px-4 py-4">
                  <Badge className={tones[document.status]}>{document.status}</Badge>
                </td>
                <td className="px-4 py-4">{formatDate(document.uploaded_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
