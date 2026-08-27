type ImageGenerationJson = {
  data?: Array<{ b64_json?: string; url?: string }>;
  b64_json?: string;
  url?: string;
  [key: string]: unknown;
};

export const ILLUSTRATION_ROUTE_VERSION =
  "generate-illustration-2026-photoreal-img2img-v1";

export const ILLUSTRATION_SYSTEM_PROMPT = `Photorealistic editorial fashion photograph. NOT an illustration, NOT painterly, NOT stylized — a real photograph.

IDENTITY (hard rule): The person in the reference image is the subject. Preserve their EXACT face, skin tone, hair, body shape, weight, and proportions. Never slim, alter, smooth, idealize, or beautify the body. Same person, same body — different outfit and setting only.

COMPOSITION (hard rule): Vertical 3:4 portrait. FULL-LENGTH: the entire figure is visible head-to-toe, standing naturally. The crown of the head must sit BELOW the top edge of the frame with clear headroom; the feet must sit ABOVE the bottom edge with clear foot room. The face and the top of the head must be fully visible and never cropped. Single figure only — no duplicate or partial second person.

STYLING: The person is wearing the outfit described in the Subject line, photographed in soft natural editorial light against a clean warm neutral background (bone, soft taupe, or warm grey). Realistic fabric drape, realistic shadows, magazine-quality photography. No text overlays, no graphics, no captions.`;

function snippet(text: string, length = 300): string {
  return text.replace(/\s+/g, " ").trim().slice(0, length);
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function jsonKeys(value: unknown): string {
  if (!value || typeof value !== "object") return "(not an object)";
  const root = Object.keys(value as Record<string, unknown>).slice(0, 12);
  const first = (value as ImageGenerationJson).data?.[0];
  const firstKeys = first && typeof first === "object" ? Object.keys(first).slice(0, 12) : [];
  return `root=[${root.join(",") || "none"}] data0=[${firstKeys.join(",") || "none"}]`;
}

function extractB64FromJson(json: ImageGenerationJson | null): string | null {
  return json?.data?.[0]?.b64_json ?? json?.b64_json ?? null;
}

function extractUrlFromJson(json: ImageGenerationJson | null): string | null {
  return json?.data?.[0]?.url ?? json?.url ?? null;
}

function extractB64FromSse(text: string): string | null {
  const events = text.split(/\n\n+/);
  let latest: string | null = null;
  for (const event of events) {
    const dataLines = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""));
    if (dataLines.length === 0) continue;
    const data = dataLines.join("\n").trim();
    if (!data || data === "[DONE]") continue;
    try {
      const payload = JSON.parse(data) as {
        b64_json?: string;
        data?: Array<{ b64_json?: string }>;
      };
      const b64 = payload.b64_json ?? payload.data?.[0]?.b64_json;
      if (b64) latest = b64;
    } catch {
      const match = data.match(/"b64_json"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      if (match?.[1]) latest = match[1].replace(/\\n/g, "");
    }
  }
  return latest;
}

async function urlToB64(url: string): Promise<string | null> {
  const imageRes = await fetch(url);
  if (!imageRes.ok) {
    console.error("[generate-illustration] image URL fetch failed", {
      routeVersion: ILLUSTRATION_ROUTE_VERSION,
      status: imageRes.status,
      contentType: imageRes.headers.get("content-type"),
    });
    return null;
  }
  return bytesToB64(new Uint8Array(await imageRes.arrayBuffer()));
}

export async function generateIllustrationBytes(params: {
  prompt: string;
  apiKey: string;
  referenceImageB64?: string;
  logPrefix?: string;
}): Promise<{ bytes: Uint8Array; routeVersion: string }> {
  const fullPrompt = `${ILLUSTRATION_SYSTEM_PROMPT}\n\nSubject: ${params.prompt}`;
  const startedAt = Date.now();
  const logPrefix = params.logPrefix ?? "[generate-illustration]";

  let upstream: Response;
  if (params.referenceImageB64) {
    // Image-to-image: OpenAI-compatible /v1/images/edits, multipart form-data.
    // Field name is `image` (a file part); prompt + model as text fields.
    const refBytes = b64ToBytes(params.referenceImageB64);
    const form = new FormData();
    form.append("model", "openai/gpt-image-2");
    form.append("prompt", fullPrompt);
    form.append("size", "1024x1536");
    form.append(
      "image",
      new Blob([new Uint8Array(refBytes)], { type: "image/png" }),
      "reference.png",
    );
    upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/edits", {
      method: "POST",
      headers: {
        "Lovable-API-Key": params.apiKey,
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: form,
    });
  } else {
    upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Lovable-API-Key": params.apiKey,
        "X-Lovable-AIG-SDK": "raw-fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: fullPrompt,
        quality: "low",
      }),
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const rawBytes = new Uint8Array(await upstream.arrayBuffer());
  const rawBody = /^image\//i.test(contentType) ? "" : new TextDecoder().decode(rawBytes);
  const baseLog = {
    routeVersion: ILLUSTRATION_ROUTE_VERSION,
    mode: params.referenceImageB64 ? "img2img" : "txt2img",
    status: upstream.status,
    contentType,
    durationMs: Date.now() - startedAt,
    bodySnippet: snippet(rawBody),
  };

  let parsed: ImageGenerationJson | null = null;
  if (/json/i.test(contentType) || rawBody.trim().startsWith("{")) {
    try {
      parsed = JSON.parse(rawBody) as ImageGenerationJson;
    } catch (error) {
      console.error(`${logPrefix} JSON parse failed`, {
        ...baseLog,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.info(`${logPrefix} upstream response`, {
    ...baseLog,
    jsonKeys: parsed ? jsonKeys(parsed) : undefined,
  });

  if (!upstream.ok) {
    throw new Error(
      `Upstream image error ${upstream.status}; content-type=${contentType}; body=${snippet(rawBody, 600)}`,
    );
  }

  let b64 = extractB64FromJson(parsed);
  if (!b64) {
    const imageUrl = extractUrlFromJson(parsed);
    if (imageUrl) b64 = await urlToB64(imageUrl);
  }
  if (
    (!b64 && /text\/event-stream|^data:/i.test(contentType)) ||
    (!b64 && rawBody.includes("b64_json"))
  ) {
    b64 = extractB64FromSse(rawBody);
  }
  if (!b64 && /^image\//i.test(contentType)) b64 = bytesToB64(rawBytes);
  if (!b64) {
    throw new Error(
      `Upstream returned no extractable image; status=${upstream.status}; content-type=${contentType}; jsonKeys=${parsed ? jsonKeys(parsed) : "none"}; body=${snippet(rawBody)}`,
    );
  }

  return { bytes: b64ToBytes(b64), routeVersion: ILLUSTRATION_ROUTE_VERSION };
}
