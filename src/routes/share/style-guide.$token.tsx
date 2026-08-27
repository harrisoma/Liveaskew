import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getSharedStyleGuide } from "@/lib/my-style-guide.functions";
import { MagazineSpread } from "@/components/MagazineSpread";

export const Route = createFileRoute("/share/style-guide/$token")({
  head: () => ({
    meta: [
      { title: "A LiveAskew Style Guide" },
      {
        name: "description",
        content: "A personal style guide, edited by Bee. Shared via LiveAskew.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SharedStyleGuidePage,
});

function SharedStyleGuidePage() {
  const { token } = Route.useParams();
  const fetchShared = useServerFn(getSharedStyleGuide);
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared-style-guide", token],
    queryFn: () => fetchShared({ data: { token } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="eyebrow text-ink/50">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-8 text-center">
        <p className="eyebrow text-ink/50 mb-4">Link unavailable</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">
          This style guide isn't shared anymore.
        </h1>
        <p className="text-ink/65 mb-8 max-w-md">
          The owner may have rotated or disabled the share link. Ask them for a
          new one — or start your own guide.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-8 py-4 bg-ink text-cream text-sm tracking-[0.22em] uppercase"
        >
          Visit LiveAskew
        </Link>
      </div>
    );
  }

  return (
    <MagazineSpread
      data={data}
      toolbar={
        <>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-[11px] tracking-[0.24em] uppercase border hairline hover:bg-ink hover:text-cream transition-colors"
          >
            Download PDF
          </button>
          <Link
            to="/"
            className="px-4 py-2 text-[11px] tracking-[0.24em] uppercase bg-ink text-cream"
          >
            Get your own
          </Link>
        </>
      }
    />
  );
}
