import { NextResponse } from "next/server";
import { getLeadTemperatureSnapshots } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const temperatures = await getLeadTemperatureSnapshots();
    return NextResponse.json({ temperatures });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error." },
      { status: 400 }
    );
  }
}
