import { PortalManager } from "@/components/tables/portal-manager";
import { getPortalAccess, getPortalActivity, getPortalMessages, getStudents } from "@/lib/data";

export default async function PortalManagerPage() {
  const [students, access, messages, activity] = await Promise.all([
    getStudents(),
    getPortalAccess(),
    getPortalMessages(12),
    getPortalActivity(12)
  ]);

  return <PortalManager students={students} access={access} messages={messages} activity={activity} />;
}
