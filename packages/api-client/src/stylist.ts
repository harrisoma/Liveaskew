export type Occasion = "school-run" | "maternity-day" | "boardroom" | "weekend";
export type BodyStage = "maternity" | "postpartum" | "everyday";

export type OutfitPlan = {
  title: string;
  note: string;
  pieces: { role: string; item: string; why: string }[];
};

const PLANS: Record<Occasion, Record<BodyStage, OutfitPlan>> = {
  "school-run": {
    maternity: {
      title: "School gate, room to grow",
      note: "The coat closes over the bump. Nothing needs to be unbuttoned in the car line.",
      pieces: [
        {
          role: "Layer",
          item: "Long knit coat",
          why: "Open front, so the bump is not a zipper problem.",
        },
        {
          role: "Top",
          item: "Soft jersey tee",
          why: "Sits under a coat without clinging at the waist.",
        },
        {
          role: "Bottom",
          item: "Stretch ponte legging",
          why: "A full panel, not a tight waistband.",
        },
        { role: "Shoe", item: "Leather sneaker", why: "You are walking, not posing." },
      ],
    },
    postpartum: {
      title: "School gate, hands free",
      note: "A layer you can take off in the car without rearranging a baby.",
      pieces: [
        {
          role: "Layer",
          item: "Washed cotton overshirt",
          why: "Covers a nursing layer and comes off in one move.",
        },
        { role: "Top", item: "Nursing tank", why: "The real top stays on." },
        {
          role: "Bottom",
          item: "Soft trouser",
          why: "A high rise that does not cut a healing waist.",
        },
        { role: "Shoe", item: "Sneaker", why: "The walk from the gate is the whole commute." },
      ],
    },
    everyday: {
      title: "School gate, then the rest of the day",
      note: "One outfit that can sit in a meeting if the morning runs long.",
      pieces: [
        {
          role: "Layer",
          item: "Unstructured blazer",
          why: "It reads as dressed once you are indoors.",
        },
        { role: "Top", item: "Fine knit", why: "No iron, no performance." },
        { role: "Bottom", item: "Straight trouser", why: "The same leg from the car to a chair." },
        { role: "Shoe", item: "Low leather sneaker", why: "Quiet enough for the office." },
      ],
    },
  },
  "maternity-day": {
    maternity: {
      title: "A day on the bump",
      note: "Every piece earns its place by stretching where you actually grow.",
      pieces: [
        { role: "Dress", item: "Empire knit dress", why: "The seam sits above the bump." },
        {
          role: "Layer",
          item: "Long gold-button cardigan",
          why: "Adds a shoulder line when the dress is simple.",
        },
        { role: "Shoe", item: "Block heel", why: "A little height without a balancing act." },
      ],
    },
    postpartum: {
      title: "The in-between day",
      note: "Clothes that forgive a body that is still changing size.",
      pieces: [
        { role: "Dress", item: "Wrap dress", why: "The tie moves with you." },
        {
          role: "Layer",
          item: "Soft blazer",
          why: "Structure at the shoulder, none at the waist.",
        },
        { role: "Shoe", item: "Mary Jane flat", why: "You can get them on one-handed." },
      ],
    },
    everyday: {
      title: "An easy dressed day",
      note: "The same ease, without a maternity cut.",
      pieces: [
        { role: "Dress", item: "Column knit dress", why: "One piece, a clear line." },
        { role: "Layer", item: "Cropped jacket", why: "Breaks the column at the hip." },
        { role: "Shoe", item: "Slingback", why: "Finished, and you can drive in them." },
      ],
    },
  },
  boardroom: {
    maternity: {
      title: "The boardroom, with a bump",
      note: "Tailoring that expands. The body is not the thing being styled away.",
      pieces: [
        {
          role: "Jacket",
          item: "Stretch wool blazer",
          why: "A real shoulder, with give through the back.",
        },
        {
          role: "Top",
          item: "Silk shell",
          why: "Sits clean under the jacket, including over a nursing layer.",
        },
        {
          role: "Bottom",
          item: "Support-waist trouser",
          why: "The waist moves. The leg stays straight.",
        },
        { role: "Shoe", item: "Low block heel", why: "You can stand for the whole meeting." },
      ],
    },
    postpartum: {
      title: "Back in the room",
      note: "The suit fits the body you have this month, not the one from the photo on the badge.",
      pieces: [
        {
          role: "Jacket",
          item: "Single-button blazer",
          why: "Buttoned or open, the line still holds.",
        },
        { role: "Top", item: "Matte jersey shell", why: "Forgives a changing chest." },
        { role: "Bottom", item: "Elastic-back trouser", why: "Looks tailored from the front." },
        { role: "Shoe", item: "Pointed flat", why: "The meeting shoe you can walk to the car in." },
      ],
    },
    everyday: {
      title: "Boardroom, ordinary Tuesday",
      note: "Fit, then fabric. The jacket is cut for your shoulder, not a sample size.",
      pieces: [
        { role: "Jacket", item: "Wool blazer", why: "The shoulder is the point." },
        { role: "Top", item: "Silk shirt", why: "One good texture is enough." },
        { role: "Bottom", item: "Tailored trouser", why: "Hemmed to the shoe you actually own." },
        { role: "Shoe", item: "Leather pump", why: "Low enough to last the day." },
      ],
    },
  },
  weekend: {
    maternity: {
      title: "Weekend, unbuttoned",
      note: "Denim that sits under the bump, and a shirt you already love.",
      pieces: [
        { role: "Top", item: "Oversized shirt", why: "Borrowed volume, not a costume." },
        { role: "Bottom", item: "Under-bump jean", why: "No waistband across the middle." },
        { role: "Shoe", item: "Sneaker", why: "The weekend is for walking." },
      ],
    },
    postpartum: {
      title: "Weekend, soft structure",
      note: "Comfort that still has a collar.",
      pieces: [
        { role: "Top", item: "Polo knit", why: "A neckline, without a stiff shirt." },
        { role: "Bottom", item: "Wide cotton trouser", why: "Air, and a waist that gives." },
        { role: "Shoe", item: "Loafer", why: "One step more dressed than a sneaker." },
      ],
    },
    everyday: {
      title: "Weekend, still you",
      note: "The off-duty version of the same wardrobe, not a second closet.",
      pieces: [
        { role: "Top", item: "Cashmere crew", why: "The piece you repeat." },
        { role: "Bottom", item: "Dark jean", why: "A straight leg, hemmed." },
        { role: "Shoe", item: "Loafer", why: "It goes back to work on Monday." },
      ],
    },
  },
};

export function planOutfit(input: { occasion: Occasion; stage: BodyStage }): OutfitPlan {
  return PLANS[input.occasion][input.stage];
}
