export function visionPayload(imageUrl: string) {
  return {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this garment for a working mother's wardrobe. Cover color, fabric, formality, and whether the cut works from maternity through the boardroom. Do not comment on her body.",
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  };
}

export async function describeGarment(options: {
  apiKey: string;
  imageUrl: string;
  baseUrl?: string;
}) {
  const base = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(visionPayload(options.imageUrl)),
  });
  if (!response.ok) throw new Error(`Vision request failed (${response.status})`);
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}
