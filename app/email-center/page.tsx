import { EmailCenter } from "@/components/tables/email-center";
import { getCommunicationLogs, getEmailTemplates, getStudents } from "@/lib/data";

export default async function EmailCenterPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialStudentId = Array.isArray(resolvedSearchParams.student)
    ? resolvedSearchParams.student[0] ?? null
    : resolvedSearchParams.student ?? null;
  const [students, templates, emailLogs] = await Promise.all([
    getStudents(),
    getEmailTemplates(),
    getCommunicationLogs({ noteTypes: ["email"], limit: 24 })
  ]);

  return (
    <EmailCenter
      students={students
        .filter((student) => Boolean(student.email))
        .map((student) => ({
          id: student.id,
          full_name: student.full_name,
          email: student.email,
          stage: student.stage,
          country_interest: student.country_interest
        }))}
      templates={templates}
      logs={emailLogs}
      initialStudentId={initialStudentId}
    />
  );
}
