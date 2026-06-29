import { NextResponse } from "next/server";
import { collectOrbiterData } from "@/lib/orbiter";

export const dynamic = "force-dynamic";
// Allow the per-feed fetch revalidate caches in collectOrbiterData to work (force-dynamic
// would otherwise force-no-store), so repeat loads are fast and upstreams aren't hammered.
export const fetchCache = "default-cache";

export async function GET() {
  try {
    return NextResponse.json(await collectOrbiterData());
  } catch (error) {
    console.error("ORBITER aggregation failed", error);
    return NextResponse.json({ error: "Unable to aggregate planetary feeds" }, { status: 502 });
  }
}
