import { NextResponse } from "next/server";
import { collectIss, collectCrew } from "@/lib/orbiter";

export const dynamic = "force-dynamic";
export const fetchCache = "default-cache";

// Lightweight, high-frequency endpoint. The client polls this every few seconds for
// live ISS telemetry without re-hitting the rate-limited NASA / Launch Library feeds.
export async function GET() {
  try {
    const [iss, crew] = await Promise.all([collectIss(), collectCrew()]);
    return NextResponse.json({ iss, crew, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("ORBITER ISS feed failed", error);
    return NextResponse.json({ error: "Unable to read ISS telemetry" }, { status: 502 });
  }
}
