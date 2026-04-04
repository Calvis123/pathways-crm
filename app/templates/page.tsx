import { TemplatesTable } from "@/components/tables/templates-table";
import { getEmailTemplates } from "@/lib/data";

export default async function TemplatesPage() {
  const templates = await getEmailTemplates();
  return <TemplatesTable templates={templates} />;
}
