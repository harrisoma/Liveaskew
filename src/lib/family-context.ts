// Shared helper used by Bee chat streaming + calendar outfit generation
// to render a family member's styling context into the system prompt.

type FamilyRow = {
  id: string;
  name: string;
  relationship: string;
  sizes: unknown;
  aesthetic_territory: string | null;
  notes: string | null;
};

export function buildFamilyVoiceBlock(member: FamilyRow): string {
  const rel = member.relationship.toLowerCase();
  const isChild = rel === "child";
  const isMan = rel === "husband";
  const sizes =
    member.sizes && typeof member.sizes === "object" ? JSON.stringify(member.sizes) : "{}";

  const voice = isChild
    ? `You are styling a child in this household. Shift to growth-aware kids styling: durable fabrics, room to grow, washable finishes, age-appropriate silhouettes, weather-aware layering. Keep your editorial voice — never talk down. Avoid character licensing and fast-trend slogans.`
    : isMan
      ? `You are styling a man in this household. Use menswear vocabulary: tailoring, break, lapel, gorge, shoulder line, trouser rise, shoe last. Recommend menswear brands and silhouettes. Do not propose womenswear pieces.`
      : `You are styling another adult in this household. Honour their own Fit · Feel · Fabric — do not default to the primary member's palette or silhouettes.`;

  return `\n\n[Active Styling Subject — switched from primary member]
Name: ${member.name}
Relationship: ${member.relationship}
Sizes: ${sizes}
Aesthetic territory: ${member.aesthetic_territory ?? "(not set)"}
Notes: ${member.notes ?? "(none)"}

${voice}

When you write back, address the primary member but speak about "${member.name}" in the third person. Never confuse them with the primary member.`;
}
