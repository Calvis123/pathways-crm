import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Public sign-up is disabled. Ask an administrator to create your Barak Pathways account."
    },
    { status: 403 }
  );
}
