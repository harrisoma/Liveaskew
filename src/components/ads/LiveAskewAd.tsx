import type { CSSProperties } from "react";
import { adFrame, LIVEASKEW_AD_BRAND, type AdFormat } from "@/lib/ads/liveaskew";
import "./ads.css";

export type AdImage = { src: string; alt: string; sampleCell?: number };
/** Pure frame-controlled composition. A renderer must supply approved, licensed assets. */
export function LiveAskewAd({
  format,
  frame,
  images,
}: {
  format: AdFormat;
  frame: number;
  images: readonly AdImage[];
}) {
  const state = adFrame(frame);
  const image = images[state.shot % images.length];
  const cell = image?.sampleCell;
  const sprite: CSSProperties =
    cell === undefined
      ? {}
      : {
          backgroundImage: `url("${image.src}")`,
          backgroundSize: "400% 200%",
          backgroundPosition: `${((cell % 4) * 100) / 3}% ${Math.floor(cell / 4) * 100}%`,
        };
  return (
    <div
      className={`la-ad la-ad-${format.id}`}
      data-phase={state.phase}
      style={{ "--ad-gold": LIVEASKEW_AD_BRAND.colors.gold } as CSSProperties}
    >
      <div className="la-ad-photo" style={{ transform: `scale(${state.scale})` }}>
        {image ? (
          cell === undefined ? (
            <img src={image.src} alt={image.alt} />
          ) : (
            <div role="img" aria-label={image.alt} style={sprite} />
          )
        ) : (
          <p>Approved fashion image required</p>
        )}
      </div>
      <div className="la-ad-shade" />
      <div className="la-ad-safe">
        <div className="la-ad-wordmark">
          Live<span>Askew</span>
        </div>
        <div
          className="la-ad-copy"
          style={{ opacity: state.reveal, transform: `translateY(${(1 - state.reveal) * 12}px)` }}
        >
          <h2>{state.phase === "cta" ? format.cta : format.hook}</h2>
          <p>{format.detail}</p>
        </div>
        <div className="la-ad-footer">
          {state.phase === "cta" ? (
            <span className="la-ad-cta">{format.cta}</span>
          ) : (
            <span>Personal style, with Bee</span>
          )}
          <span>liveaskew.com</span>
        </div>
      </div>
    </div>
  );
}
