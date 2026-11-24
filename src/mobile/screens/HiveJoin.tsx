import { useId, useState } from "react";
import { MessageCircle, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import crest from "@/assets/brand/crest-bee.webp";
import "./community.css";
export function HiveJoin({ onSave }: { onSave: (name: string) => Promise<string | null> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const clean = name.trim().replace(/\s+/g, " ");
  return (
    <div className="la-hive-join">
      <section className="la-hive-welcome">
        <img src={crest} alt="" width="64" height="64" />
        <h1>
          Your people.
          <br />
          Your kind of style.
        </h1>
        <p>A little inspiration. An honest second opinion. A place to share what feels like you.</p>
        <ul>
          <li>
            <MessageCircle size={18} aria-hidden />
            <span>
              <strong>Talk it through</strong>Swap ideas in small community rooms.
            </span>
          </li>
          <li>
            <Heart size={18} aria-hidden />
            <span>
              <strong>Keep it kind</strong>Talk about the outfit, never someone’s body.
            </span>
          </li>
          <li>
            <ShieldCheck size={18} aria-hidden />
            <span>
              <strong>Stay in control</strong>Report, block, or leave a conversation.
            </span>
          </li>
        </ul>
      </section>
      <section className="la-hive-name">
        <span className="la-community-label">Welcome to the Hive</span>
        <h2>What should we call you?</h2>
        <p>Choose the name other members see beside your messages.</p>
        <div className="la-hive-identity">
          <span aria-hidden>{clean.slice(0, 1).toUpperCase() || "✦"}</span>
          <div>
            <strong>{clean || "Your Hive name"}</strong>
            <small>Your community profile</small>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || clean.length < 2 || clean.length > 40) return;
            setBusy(true);
            setError(null);
            try {
              setError(await onSave(clean));
            } catch {
              setError("Your name couldn’t save. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label htmlFor={id}>Display name</label>
          <input
            id={id}
            value={name}
            maxLength={40}
            autoComplete="nickname"
            placeholder="First name or nickname"
            onChange={(e) => setName(e.target.value)}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
            aria-invalid={!!error}
          />
          <small id={`${id}-help`}>2–40 characters. You don’t need to use your full name.</small>
          {error && (
            <p role="alert" id={`${id}-error`}>
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || clean.length < 2 || clean.length > 40}>
            {busy ? "Joining…" : "Join the Hive"}
            <ArrowRight size={17} aria-hidden />
          </button>
        </form>
        <p className="la-community-note">
          <ShieldCheck size={15} aria-hidden /> Your email and phone number aren’t shown on your
          Hive profile.
        </p>
      </section>
    </div>
  );
}
