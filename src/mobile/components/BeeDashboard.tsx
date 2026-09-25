import { useEffect, useState, type FormEvent } from "react";
import { CONNECT_DOORS, openPlatformLogin, type ConnectDoorId } from "@/lib/buzz";
import { attachAccount, loadAccounts, loadAutonomous, saveAutonomous, weekDays } from "@/lib/house";
import { serialNumber } from "../lib/dashboard-looks";
import type { GuideLook } from "../lib/storage";
import { BrandLogo } from "./BrandLogos";
import { NeoButton } from "./ui";

const SCHEDULE_KEY = "la_bee_schedule_v1";

function loadSchedule(): Record<string, string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SCHEDULE_KEY) ?? "{}") as Record<
      string,
      string
    >;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function BeeDashboard({
  looks,
  selfie,
  renderingId,
  onUpload,
  onGenerate,
}: {
  looks: GuideLook[];
  selfie: string | null;
  renderingId: string | null;
  onUpload: () => void;
  onGenerate: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [doors, setDoors] = useState<ConnectDoorId[]>([]);
  const [handles, setHandles] = useState<Partial<Record<ConnectDoorId, string>>>({});
  const [automate, setAutomate] = useState(false);
  const [login, setLogin] = useState<ConnectDoorId | null>(null);
  const [handle, setHandle] = useState("");
  const [days, setDays] = useState<{ weekday: string; date: string }[]>([]);
  const [schedule, setSchedule] = useState<Record<string, string>>({});
  const look = looks[Math.min(index, Math.max(looks.length - 1, 0))];
  const portrait = look?.tryOnUrl || selfie;

  useEffect(() => {
    const accounts = loadAccounts();
    const nextHandles: Partial<Record<ConnectDoorId, string>> = {};
    const nextDoors: ConnectDoorId[] = [];
    for (const account of accounts) {
      if (CONNECT_DOORS.some((door) => door.id === account.platform)) {
        const id = account.platform as ConnectDoorId;
        nextHandles[id] = account.handle;
        nextDoors.push(id);
      }
    }
    setHandles(nextHandles);
    setDoors(nextDoors);
    setAutomate(loadAutonomous());
    setDays(weekDays(new Date()));
    setSchedule(loadSchedule());
  }, []);

  function openDoor(id: ConnectDoorId) {
    openPlatformLogin(id);
    setLogin(id);
    setHandle(handles[id] ?? "");
  }

  function attach(event: FormEvent) {
    event.preventDefault();
    if (!login) return;
    const next = handle.trim();
    if (!next) return;
    const accounts = attachAccount({ platform: login, handle: next });
    setHandles((current) => ({ ...current, [login]: next }));
    setDoors(
      accounts
        .map((account) => account.platform)
        .filter((id): id is ConnectDoorId => CONNECT_DOORS.some((door) => door.id === id)),
    );
    setLogin(null);
  }

  function chooseDay(lookId: string, date: string) {
    const next = { ...schedule, [lookId]: date };
    if (!date) delete next[lookId];
    setSchedule(next);
    window.localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next));
  }

  return (
    <div className="bee-dash">
      <article className="bee-card">
        <div className="bee-card-head">
          <h1>Looks</h1>
          <div className="bee-card-actions">
            <NeoButton variant="ink" onClick={onGenerate}>
              Generate looks
            </NeoButton>
            <NeoButton onClick={onUpload}>{selfie ? "Replace selfie" : "Upload selfie"}</NeoButton>
          </div>
        </div>
        {look ? (
          <div className="bee-carousel">
            <button
              type="button"
              className="bee-carousel-nav"
              aria-label="Previous look"
              onClick={() => setIndex((value) => (value - 1 + looks.length) % looks.length)}
            >
              ‹
            </button>
            <figure>
              {portrait ? (
                <img
                  src={portrait}
                  alt={`${look.title}, with your selfie rendered into the look`}
                />
              ) : (
                <div className="bee-carousel-empty">
                  Upload a selfie. Bee renders it into each look.
                </div>
              )}
              {renderingId === look.id && (
                <p className="bee-rendering">Rendering you into this look</p>
              )}
              <figcaption>
                <p>SN {serialNumber(index)}</p>
                <strong>{look.title}</strong>
                <span>{look.formula.join(" · ")}</span>
              </figcaption>
            </figure>
            <button
              type="button"
              className="bee-carousel-nav"
              aria-label="Next look"
              onClick={() => setIndex((value) => (value + 1) % looks.length)}
            >
              ›
            </button>
          </div>
        ) : (
          <p className="bee-carousel-empty">Generate looks to fill the carousel.</p>
        )}
        <div className="bee-dots" role="tablist" aria-label="Looks">
          {looks.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Look ${serialNumber(itemIndex)}`}
              aria-selected={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
            />
          ))}
        </div>
      </article>

      <div className="bee-dash-lower">
        <section className="bee-social" aria-label="Connect your social">
          <h2>Connect your social</h2>
          <div className="bee-pills">
            {CONNECT_DOORS.map((door) => (
              <button
                key={door.id}
                type="button"
                className="bee-pill"
                style={{ background: door.color, color: door.ink }}
                aria-label={`Log in to ${door.name}`}
                aria-pressed={doors.includes(door.id)}
                onClick={() => openDoor(door.id)}
              >
                <BrandLogo id={door.id} />
                <span>{door.name}</span>
              </button>
            ))}
          </div>
          <label className="bee-automate">
            <span>Automate</span>
            <input
              type="checkbox"
              role="switch"
              checked={automate}
              aria-label="Automate"
              onChange={(event) => {
                setAutomate(event.target.checked);
                saveAutonomous(event.target.checked);
              }}
            />
          </label>
        </section>

        <section className="bee-scheduler" aria-label="Scheduler">
          <h2>Scheduler</h2>
          <ul>
            {looks.map((item, itemIndex) => (
              <li key={item.id}>
                <p>
                  <span>SN {serialNumber(itemIndex)}</span>
                  {item.title}
                </p>
                <label>
                  Day
                  <select
                    aria-label={`Schedule ${item.title}`}
                    value={schedule[item.id] ?? ""}
                    onChange={(event) => chooseDay(item.id, event.target.value)}
                  >
                    <option value="">Choose a day</option>
                    {days.map((day) => (
                      <option key={day.date} value={day.date}>
                        {day.weekday}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {login && (
        <dialog open className="bee-login" aria-labelledby="bee-login-title">
          <BrandLogo id={login} />
          <h2 id="bee-login-title">
            Log in to {CONNECT_DOORS.find((door) => door.id === login)?.name}
          </h2>
          <p>Sign in on that network. Bee keeps the handle. The password stays there.</p>
          <button
            type="button"
            className="neo-btn neo-btn-ink"
            onClick={() => openPlatformLogin(login)}
          >
            Log in
          </button>
          <form onSubmit={attach}>
            <label>
              Handle
              <input
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                aria-label={`${login} handle`}
                placeholder="@handle"
              />
            </label>
            <button type="submit" className="neo-btn">
              Attach
            </button>
            <button type="button" onClick={() => setLogin(null)}>
              Close
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
