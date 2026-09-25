import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SocialMarks, type SocialId } from "@/components/site/SocialMarks";
import { BUZZ_PLATFORMS, buzzMessage, buzzWeek, type BuzzPlatformId } from "@/lib/buzz";
import {
  BEE_LOOKS,
  attachAccount,
  dateStamp,
  detachAccount,
  ensureLookOfTheDay,
  handedWeek,
  loadAccounts,
  loadAutonomous,
  runAutonomousPosts,
  saveAutonomous,
  scheduleLookOnHoney,
  writeBeeCaptions,
  type BeeLookId,
} from "@/lib/house";
import { honeyIcon, loadHoney, type HoneyItem } from "@/lib/honey";
import buzzHero from "@/assets/wardrobe-flatlay.jpg";

function dayLabel(stamp: string) {
  return new Date(`${stamp}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export const Route = createFileRoute("/buzz")({
  head: () => ({
    meta: [
      { title: "Buzz — LiveAskew" },
      {
        name: "description",
        content:
          "Grow your presence. Buzz posts the look to Instagram, TikTok, Pinterest, Facebook, and LinkedIn through each network's own door.",
      },
    ],
  }),
  component: BuzzPage,
});

function BuzzPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [ready, setReady] = useState(false);
  const [handles, setHandles] = useState<Partial<Record<BuzzPlatformId, string>>>({});
  const [lookId, setLookId] = useState<BeeLookId>("boardroom");
  const [when, setWhen] = useState("09:00");
  const [postDate, setPostDate] = useState("");
  const [clock, setClock] = useState<Date | null>(null);
  const [queue, setQueue] = useState<HoneyItem[]>([]);
  const [chosen, setChosen] = useState<BuzzPlatformId[]>([]);
  const [attached, setAttached] = useState<BuzzPlatformId[]>([]);
  const [autonomous, setAutonomous] = useState(false);
  const [captions, setCaptions] = useState<Partial<Record<BuzzPlatformId, string>>>({});
  const [pass, setPass] = useState(0);
  const [scheduled, setScheduled] = useState<string | null>(null);
  const look = instruction.trim();
  const week = useMemo(() => (clock ? handedWeek(clock) : []), [clock]);
  const todayName = clock ? clock.toLocaleDateString("en-US", { weekday: "long" }) : "today";
  const selected = BEE_LOOKS.find((item) => item.id === lookId) ?? BEE_LOOKS[0];
  const handed = week.find((item) => item.id === lookId);

  useEffect(() => {
    const now = new Date();
    const accounts = loadAccounts();
    const next: Partial<Record<BuzzPlatformId, string>> = {};
    for (const account of accounts) next[account.platform] = account.handle;
    setHandles(next);
    const platforms = accounts.map((account) => account.platform);
    setChosen(platforms);
    setAttached(platforms);
    setAutonomous(loadAutonomous());
    runAutonomousPosts(now);
    const items = ensureLookOfTheDay(now);
    const todayLook = handedWeek(now).find((item) => item.ofTheDay);
    setClock(now);
    setPostDate(dateStamp(now));
    if (todayLook) setLookId(todayLook.id);
    setQueue(items.filter((item) => item.kind === "post"));
  }, []);

  function attachSocials(event: FormEvent) {
    event.preventDefault();
    let accounts = loadAccounts();
    for (const platform of BUZZ_PLATFORMS) {
      const handle = handles[platform.id]?.trim();
      if (handle) accounts = attachAccount({ platform: platform.id, handle });
    }
    const platforms = accounts.map((account) => account.platform);
    setChosen(platforms);
    setAttached(platforms);
  }

  function disconnect(platform: BuzzPlatformId) {
    const accounts = detachAccount(platform);
    const platforms = accounts.map((account) => account.platform);
    setAttached(platforms);
    setChosen(platforms);
    setHandles((current) => ({ ...current, [platform]: "" }));
  }

  function chooseLook(id: BeeLookId) {
    setLookId(id);
    setCaptions({});
    setScheduled(null);
    if (clock) setPostDate(dateStamp(clock));
  }

  function schedule(event: FormEvent) {
    event.preventDefault();
    if (chosen.length === 0 || !postDate) return;
    const posts = scheduleLookOnHoney({
      lookId,
      platforms: chosen,
      date: postDate,
      time: when,
      captions,
    });
    setScheduled(
      posts
        .map((post) => post.network)
        .filter(Boolean)
        .join(", "),
    );
    setQueue(loadHoney(postDate).filter((item) => item.kind === "post"));
  }

  const today = useMemo(() => {
    if (!ready) return [];
    return BUZZ_PLATFORMS.map((platform) => ({
      ...platform,
      message: buzzMessage(look, 0, platform.id),
    }));
  }, [look, ready]);

  const lines = useMemo(() => (ready ? buzzWeek(look, "instagram") : []), [look, ready]);

  return (
    <SiteFrame>
      <section className="relative min-h-[62svh]">
        <img
          src={buzzHero}
          alt="A flat lay of a black blazer, black handbag, and cream knit on linen"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/20" />
        <div className="relative z-10 flex min-h-[62svh] items-end px-6 pt-32 pb-12 md:px-16">
          <div className="glass-dark max-w-xl rounded-[2rem] px-8 py-8">
            <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">Buzz</p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-white md:text-6xl">
              Grow your presence.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white">
              Bee hands the look to Buzz. Onixus Social publishes it. The look of the day is already
              queued, and an earlier look can still go out today.
            </p>
            <SocialMarks ids={["instagram", "tiktok", "pinterest", "facebook", "linkedin"]} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pt-10 pb-6 lg:grid-cols-2">
        <article className="glass rounded-[2rem] p-6">
          <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">From Bee</p>
          <h2 className="font-display mt-2 text-3xl">Bee handoff</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Each weekday look comes from Bee. The look of the day is already handed down and ready
            to post. Choose an earlier day when today should wear that cloth.
          </p>
          <ul className="mt-4 space-y-3">
            {week.map((item) => (
              <li key={item.id} className="rounded-2xl bg-white/70 px-4 py-3">
                <p className="text-[0.62rem] tracking-[0.16em] uppercase text-[#b8860b]">
                  {item.weekday}
                  {item.ofTheDay ? " · Look of the day · Handed down" : ""}
                </p>
                <p className="mt-1 font-display text-2xl">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed">{item.pieces}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" className="glass-btn" onClick={() => chooseLook(item.id)}>
                    {item.ofTheDay ? "Open in the scheduler" : `Post this look on ${todayName}`}
                  </button>
                  <Link to="/hive" search={{ look: item.id }} className="text-sm text-[#b8860b]">
                    Talk about this look in the Hive
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <form className="glass rounded-[2rem] p-6" onSubmit={schedule}>
          <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">Onixus Social</p>
          <h2 className="font-display mt-2 text-3xl">Social Scheduler</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Bee uses Onixus Social to publish. {selected.title} stays queued until the hour. Pick
            Friday when Tuesday&apos;s look should go out today.
          </p>
          <SocialMarks ids={["instagram", "tiktok", "pinterest", "facebook", "linkedin"]} />
          <p className="mt-4 text-sm">
            <strong>{selected.title}</strong>
            <span className="block text-black/70">{selected.pieces}</span>
          </p>
          {handed && !handed.ofTheDay && (
            <p className="mt-2 text-sm">
              This is {handed.weekday}&apos;s look. Onixus Social will queue it for{" "}
              {postDate ? dayLabel(postDate) : todayName}.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="block text-sm">
              Post date
              <input
                type="date"
                value={postDate}
                onChange={(event) => setPostDate(event.target.value)}
                className="mt-2 block rounded-xl border border-black/10 bg-white px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Hour
              <input
                type="time"
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                className="mt-2 block rounded-xl border border-black/10 bg-white px-3 py-2"
              />
            </label>
          </div>
          <button
            type="button"
            className="glass-btn mt-4"
            disabled={chosen.length === 0}
            onClick={() => {
              const written = writeBeeCaptions(selected.pieces, chosen, pass);
              const next: Partial<Record<BuzzPlatformId, string>> = {};
              for (const line of written) next[line.platform] = line.caption;
              setCaptions(next);
              setPass((value) => value + 1);
            }}
          >
            Write captions with Bee
          </button>
          {Object.keys(captions).length > 0 && (
            <ul className="mt-4 space-y-2">
              {chosen.map((platform) => (
                <li key={platform}>
                  <label className="block text-sm">
                    {BUZZ_PLATFORMS.find((item) => item.id === platform)?.name}
                    <textarea
                      value={captions[platform] ?? ""}
                      onChange={(event) =>
                        setCaptions((current) => ({ ...current, [platform]: event.target.value }))
                      }
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
          <button type="submit" className="glass-btn mt-4" disabled={chosen.length === 0}>
            Queue with Onixus Social
          </button>
          {chosen.length === 0 && (
            <p className="mt-3 text-sm">Attach a social below to queue this look.</p>
          )}
          {scheduled && (
            <p className="mt-3 text-sm">
              {selected.title} is queued with Onixus Social for {scheduled}
              {postDate ? ` on ${dayLabel(postDate)}` : ""}. It is on Honey, ready to post.
            </p>
          )}
          <h3 className="font-display mt-6 text-2xl">Ready to post</h3>
          <ul className="mt-3 space-y-2">
            {queue.map((item) => {
              const icon = honeyIcon(item.network);
              return (
                <li key={item.id} className="rounded-2xl bg-white/70 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p>
                      {dayLabel(item.date)} · {item.time}
                      <span className="text-[#b8860b]">
                        {item.posted ? " · Sent" : " · Ready to post"}
                      </span>
                    </p>
                    {icon ? <SocialMarks ids={[icon]} /> : null}
                  </div>
                  <p className="mt-1 font-display text-xl">{item.title}</p>
                  {item.caption ? <p className="mt-1 leading-relaxed">{item.caption}</p> : null}
                </li>
              );
            })}
            {queue.length === 0 && <li className="text-sm">The handoff appears here.</li>}
          </ul>
        </form>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-6">
        <form className="glass rounded-[2rem] p-6" onSubmit={attachSocials}>
          <h2 className="font-display text-3xl">Attach your socials</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Connect each network once. Buzz posts the Bee look through that door.
          </p>
          <ul className="mt-4 space-y-3">
            {BUZZ_PLATFORMS.map((platform) => (
              <li key={platform.id} className="flex items-center gap-3">
                <SocialMarks ids={[platform.id as SocialId]} />
                <input
                  value={handles[platform.id] ?? ""}
                  onChange={(event) =>
                    setHandles((current) => ({ ...current, [platform.id]: event.target.value }))
                  }
                  placeholder="@handle"
                  aria-label={`${platform.name} handle`}
                  className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                />
                {attached.includes(platform.id) ? (
                  <>
                    <span className="text-sm text-[#b8860b]">Attached</span>
                    <button
                      type="button"
                      className="text-sm"
                      onClick={() => disconnect(platform.id)}
                    >
                      Disconnect
                    </button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
          <button type="submit" className="glass-btn mt-4">
            Save accounts
          </button>
          {attached.length > 0 && (
            <p className="mt-3 text-sm">
              {attached.length} {attached.length === 1 ? "account stays" : "accounts stay"}{" "}
              attached.
            </p>
          )}
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={autonomous}
              onChange={(event) => {
                setAutonomous(event.target.checked);
                saveAutonomous(event.target.checked);
              }}
            />
            Autonomous posting. When the hour hits, Onixus Social sends the queued caption on the
            attached platforms.
          </label>
        </form>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pb-16 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          className="glass rounded-[2rem] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!photo || !look) return;
            setReady(true);
          }}
        >
          <label className="block text-sm">
            Your photo
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setPhoto(typeof reader.result === "string" ? reader.result : null);
                  setReady(false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {photo && (
            <img
              src={photo}
              alt="The photo Buzz will dress and post"
              className="mt-4 h-56 w-full rounded-[1.25rem] object-cover"
            />
          )}
          <label className="mt-5 block text-sm">
            What should you be in?
            <textarea
              value={instruction}
              onChange={(event) => {
                setInstruction(event.target.value);
                setReady(false);
              }}
              rows={4}
              required
              placeholder="Ivory silk shirt, charcoal trouser, almond loafer — a Tuesday at the office."
              className="mt-2 w-full rounded-[1.25rem] border border-black/10 bg-white/80 px-4 py-3 text-base outline-none"
            />
          </label>
          <button
            type="submit"
            className="neo-btn-ink mt-5 disabled:opacity-40"
            disabled={!photo || !look}
          >
            Post everywhere
          </button>
          <p className="mt-4 text-sm leading-relaxed text-black">
            Buzz keeps the style and sends a new line each day. Bee hands the look across. Onixus
            Social publishes it on Instagram, TikTok, Pinterest, Facebook, and LinkedIn.
          </p>
        </form>

        <div>
          {!ready && (
            <div className="glass rounded-[2rem] px-6 py-10 text-sm leading-relaxed">
              Five posts appear here. Each network gets its own wording. The week under them is the
              same style, said seven different ways.
            </div>
          )}
          {ready && (
            <>
              <ul className="space-y-3">
                {today.map((post) => (
                  <li key={post.id} className="glass rounded-[1.5rem] px-5 py-4">
                    <p className="eyebrow">{post.name}</p>
                    <p className="mt-2 text-sm leading-relaxed">{post.message}</p>
                  </li>
                ))}
              </ul>
              <h2 className="font-display mt-8 text-3xl">Every day, a different message</h2>
              <ol className="mt-4 space-y-2">
                {lines.map((message, index) => (
                  <li key={message} className="glass rounded-[1.25rem] px-4 py-3 text-sm">
                    <span className="eyebrow">Day {index + 1}</span>
                    <p className="mt-1">{message}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </section>
    </SiteFrame>
  );
}
