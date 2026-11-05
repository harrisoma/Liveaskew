import { useState } from "react";
import { ArrowRight, Bookmark, Check, CalendarDays, MessageCircle } from "lucide-react";
import { lookPhoto, type GuideLook } from "../lib/storage";
import { isoDay } from "@/lib/honey";

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
}: GuideActions & { looks: GuideLook[]; sample?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [date, setDate] = useState(() => isoDay(new Date()));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const ordered = [...looks].sort((a, b) => (a.guideDay ?? 99) - (b.guideDay ?? 99));
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
    <section className="guide-lookbook" aria-label="Your outfit lookbook">
      <header className="lookbook-heading">
        <div>
          <p>Styled by Bee</p>
          <h1>{sample ? "A little inspiration for your week." : "Your week, styled."}</h1>
        </div>
        <p>
          {sample
            ? "Three warm-weather looks. Explore each one."
            : "Choose a look. Make it yours. Get on with your day."}
        </p>
      </header>
      <div className="lookbook-picker" role="group" aria-label="Choose an outfit">
        {ordered.map((item, i) => (
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
            <span>
              {sample ? `Look ${i + 1}` : item.guideDay ? `Day ${item.guideDay}` : `Look ${i + 1}`}
            </span>
            {item.occasion}
          </button>
        ))}
      </div>
      <div className="lookbook-stage">
        <figure className="lookbook-visual">
          {sample ? (
            <div
              className="lookbook-sample-image"
              role="img"
              aria-label={`AI illustration: ${look.formula.join(", ")}`}
              style={{ backgroundPosition: `${position * 50}% center` }}
            />
          ) : photo && failedImage !== photo ? (
            <img
              src={photo}
              alt={`${look.title}: ${look.formula.join(", ")}`}
              onError={() => setFailedImage(photo)}
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
          <h3>The outfit</h3>
          <ul className="lookbook-pieces">
            {look.formula.map((piece) => (
              <li key={piece}>{piece}</li>
            ))}
          </ul>
          <details className="lookbook-rationale">
            <summary>Why Bee chose it</summary>
            <dl>
              <dt>Fit</dt>
              <dd>{look.fit}</dd>
              <dt>Feel</dt>
              <dd>{look.feel}</dd>
              <dt>Fabric</dt>
              <dd>{look.fabric}</dd>
            </dl>
          </details>
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
