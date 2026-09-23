import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { HIVE_NETWORKS, HIVE_ROOMS, HIVE_THREADS } from "@/lib/hive";

export const Route = createFileRoute("/hive")({
  head: () => ({
    meta: [
      { title: "The Hive — LiveAskew" },
      {
        name: "description",
        content:
          "The Hive brings X, Telegram, Facebook, and Instagram into one community. Talk about motherhood, style, everyday life, and editorial.",
      },
    ],
  }),
  component: HivePage,
});

function HivePage() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-[1100px] px-6 pt-16 pb-8 md:pt-24">
        <p className="eyebrow">The Hive</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
          The community, in one app.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
          The Hive merges the places clients already talk — {HIVE_NETWORKS.join(", ")} — into one
          room. Motherhood, style, everyday topics, and editorial live here together.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-4 px-6 pb-10 md:grid-cols-4">
        {HIVE_NETWORKS.map((network) => (
          <p
            key={network}
            className="rounded-[1.5rem] bg-cream px-4 py-5 text-center font-display text-2xl shadow-neo"
          >
            {network}
          </p>
        ))}
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pb-12 md:grid-cols-2">
        {HIVE_ROOMS.map((room) => (
          <article key={room.id} className="rounded-[2rem] bg-cream p-6 shadow-neo">
            <h2 className="font-display text-3xl">{room.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{room.line}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-20">
        <h2 className="font-display text-3xl">In the room</h2>
        <ul className="mt-5 space-y-3">
          {HIVE_THREADS.map((thread) => (
            <li key={thread.text} className="rounded-[1.5rem] bg-cream px-5 py-4 shadow-neo">
              <p className="eyebrow">
                {thread.room} · {thread.network}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{thread.text}</p>
            </li>
          ))}
        </ul>
      </section>
    </SiteFrame>
  );
}
