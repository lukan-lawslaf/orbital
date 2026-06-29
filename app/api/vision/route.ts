import { NextRequest, NextResponse } from "next/server";
import { collectOrbiterData } from "@/lib/orbiter";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const target: "mars" | "apod" = body?.target === "apod" ? "apod" : "mars";

  // Prefer the image URL the client already has; only re-aggregate if it wasn't sent.
  let image: string | undefined = body?.image;
  if (!image) {
    const data = await collectOrbiterData();
    image = target === "apod" ? data.apod?.url : data.mars?.image;
  }
  if (!image) return NextResponse.json({ error: "No image is currently available" }, { status: 404 });

  const key = process.env.NVIDIA_VISION_API_KEY;
  if (!key) return NextResponse.json({ error: "NVIDIA_VISION_API_KEY is not configured" }, { status: 503 });

  const prompt = target === "apod"
    ? "You are an astronomy educator. Analyze this Astronomy Picture of the Day. Identify the likely celestial objects or structures, describe the visual evidence, and explain the scientific significance in about 90 words. Separate clear observation from inference and avoid false certainty. Write in plain prose — no markdown, headings, or bullet points."
    : "You are a planetary geologist reviewing a Mars rover image. Describe the terrain, rock textures, layering, and any notable formations, then offer a plausible geological interpretation in about 90 words. Clearly distinguish observation from inference. Write in plain prose — no markdown, headings, or bullet points.";

  let response: Response;
  try {
    response = await fetch(`${process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(50000),
      body: JSON.stringify({
        model: process.env.NVIDIA_VISION_MODEL || "moonshotai/kimi-k2.6",
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image } },
        ] }],
        temperature: 0.2, max_tokens: 280, stream: false,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Vision service timed out or is unreachable" }, { status: 504 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Vision analysis failed", response.status, detail.slice(0, 300));
    return NextResponse.json({ error: `Vision analysis failed (${response.status})` }, { status: 502 });
  }
  const result = await response.json();
  return NextResponse.json({
    analysis: result.choices?.[0]?.message?.content?.trim() || "Analysis unavailable",
    image, target,
  });
}
