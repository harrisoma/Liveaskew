import { SampleOutfit } from "./SampleOutfit";
import { SampleGarment } from "./SampleGarment";
import { useState } from "react";
import { ArrowRight, Bookmark, Check, CalendarDays, MessageCircle } from "lucide-react";
import { lookPhoto, type GuideLook } from "../lib/storage";
import { isoDay } from "@/lib/honey";

function PersonalOutfitImage({
  look,
  onImageReady,
  onImageUnavailable,
}: {
  look: GuideLook;
  onImageReady?: (look: GuideLook) => void;
  onImageUnavailable?: (look: GuideLook) => void;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const image = lookPhoto(look, null);
  return image && failed !== image ? (
    <img
      src={image}
      alt={look.formula.join(", ")}
      loading="eager"
      onLoad={() => onImageReady?.(look)}
      onError={() => {
        setFailed(image);
        onImageUnavailable?.(look);
      }}
    />
  ) : (
    <div className="gallery-image-pending">
      {image ? "Personal outfit image unavailable" : "Personal outfit image not ready"}
    </div>
  );
}

export type GuideActions = {
  onSaveLook?: (look: GuideLook) => Promise<void>;
  onRestyle?: (look: GuideLook) => void;
  onPlanLook?: (look: GuideLook, date: string) => Promise<void>;
};
export function GuideLookbook({
  looks,
  sample = false,
  onSaveLook,
  onRestyle,
  onPlanLook,
  onImageReady,
  onImageUnavailable,
}: GuideActions & {
  looks: GuideLook[];
  sample?: boolean;
  onImageReady?: (look: GuideLook) => void;
  onImageUnavailable?: (look: GuideLook) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [date, setDate] = useState(() => isoDay(new Date()));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const guideLooks = looks.some((look) => look.guideDay)
    ? looks.filter((look) => look.guideDay && look.guideDay >= 1 && look.guideDay <= 7)
    : looks;
  const ordered = [...guideLooks].sort((a, b) => (a.guideDay ?? 99) - (b.guideDay ?? 99));
  const look = ordered.find((l) => l.id === selected) ?? ordered[0];
  if (!look)
    return (
      <div className="lookbook-empty">
        <h2>Your outfits start here.</h2>
        <p>
          Your styling notes are below. Open Looks to create or check your personal outfit previews.
        </p>
      </div>
    );
  const photo = lookPhoto(look, null);
  const position = Math.max(
    0,
    ordered.findIndex((l) => l.id === look.id),
  );
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      setMessage(success);
      setPlanning(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t save. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="guide-lookbook" id="outfit-playbook" aria-label="Your outfit lookbook">
      <header className="lookbook-heading">
        <div>
          <p className="personal-section-label">The Outfit Playbook</p>
          <h2>
            {sample
              ? "A little inspiration for your week."
              : "The look. The details. The way you wear it."}
          </h2>
        </div>
        <p>
          {sample
            ? "Seven complete outfits, built from one coordinated wardrobe."
            : "Choose a look. Make it yours. Get on with your day."}
        </p>
      </header>
      <div className="lookbook-gallery" role="group" aria-label="Your styled outfit gallery">
        {ordered.map((item, i) => {
          return (
            <button
              key={item.id}
              disabled={busy}
              aria-pressed={look.id === item.id}
              onClick={() => {
                setSelected(item.id);
                setMessage("");
                setPlanning(false);
              }}
            >
              {sample ? (
                <SampleOutfit index={i} description={item.formula.join(", ")} />
              ) : (
                <PersonalOutfitImage
                  look={item}
                  onImageReady={onImageReady}
                  onImageUnavailable={onImageUnavailable}
                />
              )}
              <span className="gallery-occasion">{item.occasion}</span>
              <strong>{item.title}</strong>
              <span className="gallery-action">View styling details</span>
            </button>
          );
        })}
      </div>
      <div className="lookbook-stage">
        <figure className="lookbook-visual">
          {sample ? (
            <SampleOutfit index={position} description={look.formula.join(", ")} />
          ) : photo && failedImage !== photo ? (
            <img
              src={photo}
              alt={`${look.title}: ${look.formula.join(", ")}`}
              onError={() => {
                setFailedImage(photo);
                onImageUnavailable?.(look);
              }}
            />
          ) : (
            <div className="lookbook-pending">
              <h3>
                {look.renderError || (failedImage === photo && photo)
                  ? "Preview unavailable"
                  : "Your outfit, ready to preview"}
              </h3>
              <p>
                {look.renderError || (failedImage === photo && photo)
                  ? "Your outfit details are ready below. Open Looks to retry the preview."
                  : "Your styling details are ready. Open Looks to generate or check your personal outfit image."}
              </p>
            </div>
          )}
          <figcaption>
            {sample
              ? "AI-created sample · illustrative outfits, not retailer products"
              : "Your personal outfit preview"}
          </figcaption>
        </figure>
        <div className="lookbook-details" key={look.id}>
          <p className="lookbook-occasion">{look.occasion}</p>
          <h2>{look.title}</h2>
          <p className="lookbook-reason">{look.feel}</p>
          <h3>Build the look</h3>
          {sample && (
            <div className="lookbook-garment-board" aria-label="Garments in this sample outfit">
              {(
                [
                  [4, 9, 10],
                  [0, 3, 8, 11],
                  [6, 9, 10],
                  [1, 5, 8, 11],
                  [2, 5, 9, 10],
                  [1, 3, 7, 8, 11],
                  [0, 6, 9, 10],
                ][position] ?? []
              ).map((pieceIndex, i) => (
                <figure key={pieceIndex}>
                  <SampleGarment index={pieceIndex} name={look.formula[i]} />
                  <figcaption>{look.formula[i]}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <ul className="lookbook-pieces">
            {look.formula.map((piece) => (
              <li key={piece}>{piece}</li>
            ))}
          </ul>
          <section className="lookbook-stylist-notes" aria-label="How to wear this look">
            <h3>How to wear it</h3>
            <dl>
              <dt>Fit</dt>
              <dd>{look.fit}</dd>
              <dt>Feel</dt>
              <dd>{look.feel}</dd>
              <dt>Fabric</dt>
              <dd>{look.fabric}</dd>
            </dl>
          </section>
          {sample ? (
            <a className="studio-primary lookbook-start" href="/app">
              Create my own looks <ArrowRight size={16} />
            </a>
          ) : (
            <div className="lookbook-actions">
              {onSaveLook && (
                <button
                  disabled={busy || look.saved}
                  onClick={() => void run(() => onSaveLook(look), "Look saved to your collection.")}
                >
                  {look.saved ? <Check size={17} /> : <Bookmark size={17} />}{" "}
                  {look.saved ? "Saved" : "Save look"}
                </button>
              )}
              {onRestyle && (
                <button disabled={busy} onClick={() => onRestyle(look)}>
                  <MessageCircle size={17} /> Adjust with Bee
                </button>
              )}
              {onPlanLook && (
                <button
                  disabled={busy}
                  aria-expanded={planning}
                  onClick={() => setPlanning(!planning)}
                >
                  <CalendarDays size={17} /> Plan a day
                </button>
              )}
            </div>
          )}
          {planning && onPlanLook && (
            <form
              className="lookbook-plan"
              onSubmit={(e) => {
                e.preventDefault();
                if (date)
                  void run(() => onPlanLook(look, date), "Added to Honey. Your look is planned.");
              }}
            >
              <label>
                Wear it on
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <button className="studio-primary" disabled={busy || !date}>
                {busy ? "Saving…" : "Add to Honey"}
              </button>
            </form>
          )}
          {message && (
            <p className="lookbook-feedback" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
