/** Shared delivery and imaging contract. Version changes do not regenerate paid images. */
export const STYLE_GUIDE_STANDARD = {
  version: "liveaskew-personal-guide-v1",
  looks: 8,
  capsule: { min: 12, max: 15 },
  variations: { min: 2, max: 3 },
  imageSize: "1024x1536",
  imageDirection: [
    "Create one finished, photorealistic fashion photograph per outfit, not a mood board or collage.",
    "Keep the same person's face, skin tone, hair, age, natural body size, proportions, pose and background. Do not slim, reshape, retouch or beautify.",
    "Show the entire person, head and feet, with every specified garment, shoe and accessory visible. If the reference is cropped, do not invent a body: return no result.",
    "Match the requested garment types, colours, layering and silhouettes; reuse the same appearance when a capsule piece repeats. Do not substitute a different outfit.",
    "Use natural, consistent lighting, clear fabric texture and realistic anatomy. Avoid duplicate limbs, distorted hands, floating accessories and obscured footwear.",
    "No baked-in captions, labels, logos, watermarks, price tags or interface graphics. LiveAskew applies its own typography and branding in the app.",
    "Do not replace the person with a stock model or mannequin. Never infer a preferred style from their appearance; follow the supplied outfit specification.",
  ],
} as const;
