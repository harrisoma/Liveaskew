// Bee renders through Together so the look uses Qwen instead of a premium image model.
// Qwen/Qwen-Image-2.0 is about $0.04 a picture and accepts a reference photo.
// Set TOGETHER_IMAGE_MODEL=Qwen/Qwen-Image for the older model at $0.0058 per megapixel.

const TOGETHER_IMAGES_URL = "https://api.together.xyz/v1/images/generations";
const DEFAULT_MODEL = "Qwen/Qwen-Image-2.0";

export const ILLUSTRATION_WIDTH = 768;
export const ILLUSTRATION_HEIGHT = 1024;

export function illustrationModel(): string {
  const configured = process.env.TOGETHER_IMAGE_MODEL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_MODEL;
}

export function togetherImageBody(params: {
  prompt: string;
  referenceImageUrl?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: illustrationModel(),
    prompt: params.prompt,
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_HEIGHT,
    n: 1,
    response_format: "b64_json",
  };
  if (params.referenceImageUrl) body.image_url = params.referenceImageUrl;
  return body;
}

export function togetherImageRequest(params: {
  apiKey: string;
  prompt: string;
  referenceImageUrl?: string;
}): { url: string; headers: Record<string, string>; body: string } {
  return {
    url: TOGETHER_IMAGES_URL,
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      togetherImageBody({
        prompt: params.prompt,
        referenceImageUrl: params.referenceImageUrl,
      }),
    ),
  };
}
