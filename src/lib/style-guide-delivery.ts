import {
  consistentReviewImages,
  visualReviewPassed,
  type OutfitVisualReview,
} from "./style-guide-visual-review";
import type { StyleBlueprint } from "./style-blueprint";

import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";

export const STYLE_GUIDE_LOOK_COUNT = STYLE_GUIDE_STANDARD.looks;
export const STYLE_GUIDE_MIN_VARIATIONS = STYLE_GUIDE_STANDARD.variations.min;
export const STYLE_GUIDE_MAX_VARIATIONS = STYLE_GUIDE_STANDARD.variations.max;

type DeliveryLook = {
  guideDay?: number;
  title: string;
  formula: string[];
  fit: string;
  feel: string;
  fabric: string;
  tryOnUrl: string | null;
  renderError?: string | null;
  visualReview?: OutfitVisualReview | null;
};
/** Render jobs can be ready independently; the full client guide has a stricter delivery contract. */
export function styleGuideDelivery(guide: StyleBlueprint | null, looks: DeliveryLook[]) {
  const week = looks.filter(
    (look) => look.guideDay && look.guideDay >= 1 && look.guideDay <= STYLE_GUIDE_LOOK_COUNT,
  );
  const uniqueDays = new Set(week.map((look) => look.guideDay)).size === STYLE_GUIDE_LOOK_COUNT;
  const uniqueFormulas =
    new Set(
      week.map((look) =>
        look.formula
          .map((piece) => piece.toLowerCase().trim())
          .sort()
          .join("|"),
      ),
    ).size === STYLE_GUIDE_LOOK_COUNT;
  const uniqueTitles =
    new Set(week.map((look) => look.title.toLowerCase().trim())).size === STYLE_GUIDE_LOOK_COUNT;
  const completeNotes = week.every(
    (look) =>
      look.formula.length >= 3 && [look.fit, look.feel, look.fabric].every((note) => note.trim()),
  );
  const consistentImages = consistentReviewImages(week.map((look) => look.visualReview));
  const reviewed = week.filter((look) => visualReviewPassed(look.visualReview, look)).length;
  const images = week.filter(
    (look) => look.tryOnUrl && look.tryOnUrl !== "self" && !look.renderError,
  ).length;
  const distinctImages =
    new Set(
      week
        .filter((look) => look.tryOnUrl && look.tryOnUrl !== "self" && !look.renderError)
        .map((look) => look.tryOnUrl),
    ).size === STYLE_GUIDE_LOOK_COUNT;
  const weekPieces = new Set(
    week.flatMap((look) => look.formula.map((piece) => piece.toLowerCase().trim())),
  ).size;
  const coordinatedWeek =
    weekPieces >= STYLE_GUIDE_STANDARD.capsule.min &&
    weekPieces <= STYLE_GUIDE_STANDARD.capsule.max;
  const capsuleNames = new Set(
    guide?.capsule.map((piece) => piece.name.toLowerCase().trim()) ?? [],
  );
  const wardrobeMatches = week.every((look) =>
    look.formula.every((piece) => capsuleNames.has(piece.toLowerCase().trim())),
  );
  const variations = guide?.stylingVariations?.length ?? 0;
  const capsule = guide?.capsule.length ?? 0;
  const ready = Boolean(
    guide &&
    week.length === STYLE_GUIDE_LOOK_COUNT &&
    uniqueDays &&
    uniqueFormulas &&
    uniqueTitles &&
    completeNotes &&
    coordinatedWeek &&
    wardrobeMatches &&
    reviewed === STYLE_GUIDE_LOOK_COUNT &&
    consistentImages &&
    images === STYLE_GUIDE_LOOK_COUNT &&
    distinctImages &&
    capsule >= STYLE_GUIDE_STANDARD.capsule.min &&
    capsule <= STYLE_GUIDE_STANDARD.capsule.max &&
    variations >= STYLE_GUIDE_MIN_VARIATIONS &&
    variations <= STYLE_GUIDE_MAX_VARIATIONS,
  );
  const missing = [
    ...(reviewed !== STYLE_GUIDE_LOOK_COUNT
      ? ["Visual checks passed for all eight personal outfit images"]
      : []),
    ...(reviewed === STYLE_GUIDE_LOOK_COUNT && !consistentImages
      ? ["Eight distinct outfit images made from the same reference photo"]
      : []),
    ...(!guide ? ["Your personal styling notes"] : []),
    ...(!(
      week.length === STYLE_GUIDE_LOOK_COUNT &&
      uniqueDays &&
      uniqueFormulas &&
      uniqueTitles &&
      completeNotes &&
      coordinatedWeek
    )
      ? ["Eight distinct, fully styled weekly outfits"]
      : []),
    ...(!(images === STYLE_GUIDE_LOOK_COUNT && distinctImages)
      ? ["Eight loaded, distinct personal outfit images"]
      : []),
    ...(!wardrobeMatches
      ? ["Wardrobe pieces matching all eight outfit formulas; update your guide from the interview"]
      : []),
    ...(!(
      capsule >= STYLE_GUIDE_STANDARD.capsule.min && capsule <= STYLE_GUIDE_STANDARD.capsule.max
    )
      ? ["A coordinated 12–15-piece wardrobe"]
      : []),
    ...(!(variations >= STYLE_GUIDE_MIN_VARIATIONS && variations <= STYLE_GUIDE_MAX_VARIATIONS)
      ? ["Two or three styling variations; update your guide from the interview"]
      : []),
  ];
  return { ready, looks: week.length, images, reviewed, variations, capsule, missing };
}
