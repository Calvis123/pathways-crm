import { DocumentsManager } from "@/components/tables/documents-manager";
import { getDocuments, getStudents } from "@/lib/data";

export default async function DocumentsPage() {
  const [documents, students] = await Promise.all([getDocuments(), getStudents()]);
  return <DocumentsManager documents={documents} students={students} />;
}
