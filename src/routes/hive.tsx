import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SocialMarks } from "@/components/site/SocialMarks";
import { HiveRoom } from "@/components/site/HiveRoom";
import { HIVE_ROOMS, HIVE_THREADS } from "@/lib/hive";
import hiveHero from "@/assets/hive-gathering.jpg";

export const Route = createFileRoute("/hive")({
  head: () => ({
    meta: [
      { title: "The Hive — LiveAskew" },
      {
        name: "description",
        content:
          "One community. Every side of you. A warm, unified space for motherhood, style, work, everyday life, and what's next.",
      },
    ],
  }),
  component: HivePage,
});

function HivePage() {
  return (
    <SiteFrame>
      <section className="relative min-h-[70svh]">
        <img
          src={hiveHero}
          alt="Mothers gathered on a sofa in a bright room, laughing and sipping wine, casually dressed"
          className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="relative z-10 flex min-h-[70svh] items-end px-6 pt-32 pb-12 md:px-16">
          <div className="glass-dark max-w-xl rounded-[2rem] px-8 py-8">
            <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">The Hive</p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-white md:text-6xl">
              One community.
              <br />
              Every side
              <br />
              of you.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white">
              A warm, unified space for motherhood, style, work, everyday life, and what&apos;s
              next. No juggling five apps. No performing perfect. Just real women, real wardrobes,
              real work. Sign in from any platform, follow each other, and build a social presence.
            </p>
            <SocialMarks ids={["instagram", "facebook", "tiktok", "google", "apple"]} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-6">
        <article className="glass rounded-[2rem] px-6 py-6">
          <h2 className="font-display text-3xl">One member</h2>
          <p className="mt-3 text-sm leading-relaxed">
            She signs in with Google or Apple, or with the social account she already uses. The
            rooms stay here. A follow still opens her profile on that network.
          </p>
          <SocialMarks ids={["instagram", "facebook", "tiktok", "google", "apple"]} />
        </article>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pb-12 md:grid-cols-2">
        {HIVE_ROOMS.map((room) => (
          <article key={room.id} className="glass rounded-[2rem] p-6">
            <h2 className="font-display text-3xl">{room.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-black">{room.line}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-12">
        <h2 className="font-display text-3xl">The room</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed">
          Sign in from Instagram, Facebook, TikTok, Google, or Apple. Follow the women in the room
          and build a presence from there.
        </p>
        <div className="mt-5">
          <HiveRoom />
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-20">
        <h2 className="font-display text-3xl">In the room</h2>
        <ul className="mt-5 space-y-3">
          {HIVE_THREADS.map((thread) => (
            <li key={thread.text} className="glass rounded-[1.5rem] px-5 py-4">
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
