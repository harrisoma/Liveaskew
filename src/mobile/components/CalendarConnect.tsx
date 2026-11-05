import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Link2,
  LockKeyhole,
  RefreshCw,
  Settings,
  Smartphone,
} from "lucide-react";
import { feedSource } from "@/lib/ics";
import { NeoButton, NeoField } from "./ui";

type Provider = "google" | "apple" | "outlook";
const guides = {
  google: {
    name: "Google Calendar",
    mark: "31",
    subtitle: "Your Google schedule",
    url: "https://calendar.google.com/",
    help: "https://support.google.com/calendar/answer/37648",
    steps: [
      {
        title: "Open your calendar settings",
        text: "On a computer, open Google Calendar. Choose Settings, then select the calendar you want to bring into Honey.",
        rows: ["Settings", "Settings for my calendars", "Choose your calendar"],
      },
      {
        title: "Copy your calendar link",
        text: "Choose Integrate calendar. Copy the Secret address in iCal format. Keep this link private—it gives access to your calendar.",
        rows: ["Integrate calendar", "Secret address in iCal format", "Copy link"],
      },
    ],
  },
  apple: {
    name: "Apple Calendar",
    mark: "iCloud",
    subtitle: "An iCloud calendar",
    url: "https://www.icloud.com/calendar",
    help: "https://support.apple.com/en-mide/guide/iphone/iph7613c4fb/ios",
    steps: [
      {
        title: "Choose an iCloud calendar",
        text: "On your iPhone, open Calendar, tap Calendars, then the information button beside the iCloud calendar you want to share.",
        rows: ["Calendar", "Calendars", "Your iCloud calendar   ⓘ"],
      },
      {
        title: "Choose what you share",
        text: "This method requires Public Calendar. Anyone with the link can read its events. Only continue with a calendar you are comfortable sharing publicly; you can add plans to Honey manually instead.",
        rows: ["Public Calendar", "Share Link", "Copy link"],
      },
    ],
  },
  outlook: {
    name: "Outlook Calendar",
    mark: "O",
    subtitle: "Outlook or Microsoft 365",
    url: "https://outlook.office.com/calendar/",
    help: "https://support.microsoft.com/en-us/outlook/share-your-calendar-in-outlook-com",
    steps: [
      {
        title: "Open sharing settings",
        text: "In Outlook on the web, open Settings, then Calendar and Shared calendars. Work accounts may require your organization to allow calendar publishing.",
        rows: ["Settings", "Calendar", "Shared calendars"],
      },
      {
        title: "Copy the subscription link",
        text: "Under Publish a calendar, choose the calendar and details to share. Publishing allows anyone with the link to view those details. Choose Publish, then copy the ICS link.",
        rows: ["Publish a calendar", "Choose details · Publish", "ICS · Copy link"],
      },
    ],
  },
} as const;

function CalendarMark({ provider }: { provider: Provider }) {
  return (
    <span className={`calendar-provider-mark calendar-provider-${provider}`} aria-hidden>
      {guides[provider].mark}
    </span>
  );
}

/** Deliberately illustrated, rather than pretending these are provider screenshots. */
function GuideIllustration({ provider, step }: { provider: Provider; step: number }) {
  const rows =
    step === 2
      ? ["Calendar link", "Paste your copied link", "Connect calendar"]
      : guides[provider].steps[step].rows;
  return (
    <div className="calendar-guide-art" aria-hidden="true">
      <div className="calendar-guide-art-header">
        <CalendarMark provider={provider} />
        <span>{step === 2 ? "Bring it into Honey" : guides[provider].name}</span>
        {step === 0 ? (
          <Settings size={18} />
        ) : step === 1 ? (
          <Copy size={18} />
        ) : (
          <Link2 size={18} />
        )}
      </div>
      <div className="calendar-guide-art-rows">
        {rows.map((row, i) => (
          <div key={row} data-highlight={i === 2}>
            <span>{row}</span>
            {i === 2 ? (
              <span className="calendar-guide-pointer">
                <ArrowRight size={16} />
              </span>
            ) : (
              <ChevronRight size={15} />
            )}
          </div>
        ))}
      </div>
      <span className="calendar-art-caption">Illustrated guide · menus may vary</span>
    </div>
  );
}

export function CalendarConnect({
  feeds,
  importing,
  onImport,
  onDone,
}: {
  feeds: string[];
  importing: boolean;
  onImport: (url: string) => Promise<boolean | void> | void;
  onDone: () => void;
}) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const waiting = busy || importing;
  function choose(next: Provider) {
    setProvider(next);
    setStep(0);
    setUrl("");
    setError("");
    setConnected(false);
  }
  async function connect() {
    const parsed = feedSource(url);
    if (!parsed || parsed.source !== provider) {
      setError(
        `Paste the calendar subscription link from ${provider ? guides[provider].name : "your calendar"}. A website address or sign-in link will not work.`,
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (await onImport(url.trim())) {
        setConnected(true);
        setUrl("");
      } else
        setError(
          "We couldn't confirm the connection. Your link is still here—check it and try again.",
        );
    } catch {
      setError("We couldn't connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="calendar-connect" aria-label="Connect a calendar">
      {!provider ? (
        <>
          <div className="calendar-connect-intro">
            <CalendarDays size={26} aria-hidden />
            <h2>Bring your plans together.</h2>
            <p>Choose your calendar. We’ll guide you, one step at a time.</p>
          </div>
          <div className="calendar-provider-list">
            {(["google", "apple", "outlook"] as const).map((id) => (
              <button
                key={id}
                type="button"
                className="calendar-provider-card"
                onClick={() => choose(id)}
              >
                <CalendarMark provider={id} />
                <span>
                  <strong>{guides[id].name}</strong>
                  <small>{guides[id].subtitle}</small>
                </span>
                <ChevronRight size={19} aria-hidden />
              </button>
            ))}
          </div>
          <p className="calendar-connect-note">
            Connect with a calendar link. Honey shows upcoming plans; your original calendar stays
            in control.
          </p>
          {feeds.length > 0 && (
            <div className="calendar-connected-list">
              <h3>Your calendars</h3>
              {feeds.map((feed, i) => {
                const source = feedSource(feed)?.source;
                const known = source && source !== "manual" ? source : null;
                return (
                  <div key={feed} className="calendar-connected-row">
                    <CheckCircle2 size={18} aria-hidden />
                    <span>
                      {known ? guides[known].name : "Calendar"} {i + 1}
                      <small>Tap refresh to get changes</small>
                    </span>
                    <button
                      type="button"
                      className="neo-icon-btn"
                      disabled={waiting}
                      aria-label={`Refresh ${known ? guides[known].name : "calendar"} ${i + 1}`}
                      onClick={() => {
                        void onImport(feed);
                      }}
                    >
                      <RefreshCw size={17} aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : connected ? (
        <div className="calendar-connect-success" role="status">
          <CheckCircle2 size={44} aria-hidden />
          <h2>Your calendar is connected.</h2>
          <p>
            Your upcoming plans now have a place in Honey. Refresh here when your schedule changes.
          </p>
          <NeoButton variant="gold" onClick={onDone}>
            See my calendar
          </NeoButton>
          <NeoButton
            onClick={() => {
              setProvider(null);
              setConnected(false);
            }}
          >
            Add another calendar
          </NeoButton>
        </div>
      ) : (
        <>
          <button
            className="la-text-action calendar-guide-back"
            type="button"
            disabled={waiting}
            onClick={() => {
              if (step) setStep(step - 1);
              else setProvider(null);
              setError("");
            }}
          >
            <ArrowLeft size={16} />
            {step ? "Previous step" : "Choose another calendar"}
          </button>
          <div className="calendar-guide-heading">
            <CalendarMark provider={provider} />
            <div>
              <h2>{guides[provider].name}</h2>
              <p>Step {step + 1} of 3</p>
            </div>
          </div>
          <ol className="calendar-guide-progress" aria-label="Connection steps">
            {["Open settings", "Copy link", "Connect"].map((name, i) => (
              <li
                key={name}
                aria-current={step === i ? "step" : undefined}
                data-complete={step > i}
              >
                <span>{step > i ? <Check size={13} /> : i + 1}</span>
                {name}
              </li>
            ))}
          </ol>
          <GuideIllustration provider={provider} step={step} />
          <div className="calendar-guide-copy" aria-live="polite">
            <h3>
              {step === 2
                ? "Paste your link. We’ll do the rest."
                : guides[provider].steps[step].title}
            </h3>
            <p>
              {step === 2
                ? "Bring the next 60 days into Honey. Changes stay in your original calendar; tap refresh here for updates."
                : guides[provider].steps[step].text}
            </p>
          </div>
          {step === 0 && (
            <a
              className="calendar-open-link"
              href={guides[provider].url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {provider === "apple" ? <Smartphone size={17} /> : <ExternalLink size={17} />}
              {provider === "apple" ? "Or open iCloud on the web" : `Open ${guides[provider].name}`}
              <ExternalLink size={14} />
            </a>
          )}
          {step < 2 ? (
            <NeoButton variant="gold" disabled={waiting} onClick={() => setStep(step + 1)}>
              {step === 0 ? "I found my calendar" : "I copied the link"}
              <ArrowRight size={16} aria-hidden />
            </NeoButton>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void connect();
              }}
              className="calendar-connect-form"
            >
              <label htmlFor="honey-calendar-link">Calendar link</label>
              <NeoField
                id="honey-calendar-link"
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="Paste your calendar link"
                value={url}
                disabled={waiting}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "calendar-link-error" : "calendar-link-private"}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError("");
                }}
              />
              <p id="calendar-link-private" className="calendar-connect-note">
                <LockKeyhole size={14} aria-hidden />
                Your link is never shown to other members.
              </p>
              {error && (
                <p role="alert" id="calendar-link-error">
                  {error}
                </p>
              )}
              <NeoButton type="submit" variant="gold" disabled={waiting || !url.trim()}>
                {waiting ? "Connecting your calendar…" : "Connect calendar"}
                <Link2 size={16} aria-hidden />
              </NeoButton>
            </form>
          )}
          <a
            className="calendar-guide-help"
            href={guides[provider].help}
            target="_blank"
            rel="noopener noreferrer"
          >
            Can’t find it? View{" "}
            {provider === "apple" ? "Apple’s" : provider === "google" ? "Google’s" : "Microsoft’s"}{" "}
            guide <ExternalLink size={12} />
          </a>
        </>
      )}
    </section>
  );
}
