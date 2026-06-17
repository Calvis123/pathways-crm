import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ signin: "1" });

  if (params.next?.startsWith("/")) {
    query.set("next", params.next);
  }

  redirect(`/?${query.toString()}`);
}
