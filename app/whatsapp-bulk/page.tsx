import { WhatsAppBulkManager } from "@/components/tables/whatsapp-bulk-manager";
import { getStudents } from "@/lib/data";
import { normalizeKenyanPhone } from "@/lib/utils";

export default async function WhatsappBulkPage() {
  const students = await getStudents();
  const reachable = students
    .filter((student) => student.phone && normalizeKenyanPhone(student.phone))
    .map((student) => ({
      id: student.id,
      full_name: student.full_name,
      phone: normalizeKenyanPhone(student.phone ?? "") ?? student.phone ?? "",
      stage: student.stage,
      country_interest: student.country_interest
    }));

  return <WhatsAppBulkManager students={reachable} />;
}
