import { UsersManager } from "@/components/tables/users-manager";
import { getUsers } from "@/lib/data";
import { getCurrentSession, permissionMatrix } from "@/lib/auth";

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsers(), getCurrentSession()]);
  return (
    <UsersManager
      users={users}
      currentUsername={session?.username ?? null}
      permissions={permissionMatrix}
    />
  );
}
