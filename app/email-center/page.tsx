import { EmailCenter } from "@/components/tables/email-center";
import { getCommunicationLogs, getEmailTemplates, getStudents } from "@/lib/data";

export default async function EmailCenterPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const singleStudent = Array.isArray(resolvedSearchParams.student)
    ? resolvedSearchParams.student[0] ?? null
    : resolvedSearchParams.student ?? null;
  const studentsParam = Array.isArray(resolvedSearchParams.students)
    ? resolvedSearchParams.students[0] ?? ""
    : resolvedSearchParams.students ?? "";
  const initialStudentIds = [
    ...new Set(
      [singleStudent, ...studentsParam.split(",")]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0)
    )
  ];
  const [students, templates, emailLogs] = await Promise.all([
    getStudents(),
    getEmailTemplates(),
    getCommunicationLogs({ limit: 48 })
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
      initialStudentIds={initialStudentIds}
    />
  );
}
