const VOCAB = [
  "blazer",
  "knit",
  "trouser",
  "dress",
  "sneaker",
  "heel",
  "silk",
  "stretch",
  "nursing",
  "tailored",
  "coat",
  "jean",
];

export type WardrobeItem = {
  id: string;
  label: string;
  tags: string[];
};

export function tagVector(tags: string[]) {
  const haystack = tags.join(" ").toLowerCase();
  return VOCAB.map((word) => (haystack.includes(word) ? 1 : 0));
}

export function cosine(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function rankWardrobe(items: WardrobeItem[], queryTags: string[]) {
  const query = tagVector(queryTags);
  return items
    .map((item) => ({ ...item, score: cosine(query, tagVector(item.tags)) }))
    .sort((a, b) => b.score - a.score);
}
