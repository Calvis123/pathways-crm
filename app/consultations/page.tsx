import { ConsultationsManager } from "@/components/tables/consultations-manager";
import { getConsultations, getStudents } from "@/lib/data";

export default async function ConsultationsPage() {
  const [consultations, students] = await Promise.all([getConsultations(), getStudents()]);
  return <ConsultationsManager consultations={consultations} students={students} />;
}
