import { NextRequest, NextResponse } from "next/server";
import { collectOrbiterData, type OrbiterData } from "@/lib/orbiter";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // The client already holds a fresh dashboard payload — reuse it instead of
  // re-aggregating every feed (which would double NASA/Launch Library traffic).
  const body = await request.json().catch(() => ({}));
  const data: OrbiterData = body?.data ?? (await collectOrbiterData());

  const base = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const key = process.env.NVIDIA_API_KEY || process.env.NVIDIA_ALT_API_KEY;
  if (!key) return NextResponse.json({ error: "NVIDIA_API_KEY is not configured" }, { status: 503 });

  const facts = {
    iss: data.iss,
    crew: { count: data.crew?.count, people: data.crew?.people?.slice(0, 7) },
    asteroids: data.asteroids?.slice(0, 5),
    earthquakes: data.earthquakes?.slice(0, 5),
    weather: data.weather,
    launches: data.launches?.slice(0, 3),
    spaceWeather: data.spaceWeather?.slice(0, 5),
  };

  let response: Response;
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        model: process.env.NVIDIA_LLM_MODEL || "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: "You are ORBITER, a precise planetary intelligence analyst at a mission operations center. Write a calm, factual situation briefing of 110-160 words in plain prose: no markdown, no headings, no preamble — output only the briefing itself. Open with the single most significant event. Cover Earth and space: seismic activity, near-Earth asteroids, space weather, the ISS and the people currently in space (distinguish ISS crew from others by their listed craft), and notable upcoming launches. Quote concrete figures from the telemetry. Never invent facts that are not present in the data." },
          { role: "user", content: `Generate the current planetary briefing from this normalized live telemetry: ${JSON.stringify(facts)}` },
        ],
        temperature: 0.35, top_p: 0.9, max_tokens: 400, stream: false,
      }),
    });
  } catch {
    return NextResponse.json({ error: "NVIDIA briefing service timed out or is unreachable" }, { status: 504 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("NVIDIA briefing failed", response.status, detail.slice(0, 300));
    return NextResponse.json({ error: `NVIDIA briefing failed (${response.status})` }, { status: 502 });
  }
  const result = await response.json();
  const raw = result.choices?.[0]?.message?.content || "";
  return NextResponse.json({
    briefing: stripReasoning(raw) || "Briefing unavailable",
    generatedAt: new Date().toISOString(),
    model: process.env.NVIDIA_LLM_MODEL,
  });
}

// Nemotron emits a reasoning trace before its answer. Extract the tagged briefing;
// fall back to dropping <think> blocks, then to the last substantial paragraph.
function stripReasoning(text: string): string {
  const tagged = text.match(/<briefing>([\s\S]*?)<\/briefing>/i);
  if (tagged) return tagged[1].trim();

  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const open = out.lastIndexOf("<think>");
  if (open !== -1) out = out.slice(open + 7);
  out = out.replace(/<\/?briefing>/gi, "").trim();

  // No tags at all (model reasoned in plain prose): take the longest trailing paragraph.
  if (/^(the user wants|let me|looking at|i need to|i'll)/i.test(out)) {
    const paras = out.split(/\n{2,}/).map((p) => p.replace(/^["“]|["”]$/g, "").trim());
    const best = paras.filter((p) => p.length > 200).pop();
    if (best) return best;
  }
  return out;
}
