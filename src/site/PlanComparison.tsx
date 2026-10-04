import { SITE_PLANS } from "./plans";
import type { PlanSlug } from "@/mobile/lib/tiers";

const GUIDANCE: Record<PlanSlug, string> = {
  silver: "Written styling advice and organizing your wardrobe.",
  gold: "Silver, plus seeing outfits on your own photo.",
  platinum: "Gold, plus conversations in The Hive. Shopping features are coming soon.",
  platinum_plus: "Platinum, plus sharing looks with Buzz. Partner seats are coming soon.",
  platinum_plus_family:
    "Platinum Plus access today. Family seats and shared wardrobes are coming soon.",
  atelier: "Personal attention from a human stylist, with a brief and price agreed together.",
};

export function PlanComparison({ onChoose }: { onChoose: (index: number) => void }) {
  return (
    <section className="mx-auto mb-10 max-w-[980px] px-5" aria-labelledby="compare-memberships">
      <div className="glass overflow-hidden rounded-[2rem] p-5 sm:p-7">
        <h3 id="compare-memberships" className="text-2xl font-semibold tracking-tight">
          Find your fit.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-black/65">
          Compare the monthly memberships, then open a chapter for the full details.
        </p>
        <table className="mt-5 w-full border-collapse text-left text-sm">
          <caption className="sr-only">Membership prices and what each plan is for</caption>
          <thead>
            <tr className="border-b border-black/15">
              <th scope="col" className="py-3 pr-4 font-semibold">
                Membership
              </th>
              <th scope="col" className="py-3 font-semibold">
                What it adds
              </th>
            </tr>
          </thead>
          <tbody>
            {SITE_PLANS.map((plan, index) => (
              <tr key={plan.slug} className="border-b border-black/10 last:border-0">
                <th scope="row" className="w-[38%] py-4 pr-4 align-top font-normal">
                  <button
                    type="button"
                    onClick={() => onChoose(index)}
                    className="min-h-11 text-left font-semibold underline decoration-[#c6a45c] underline-offset-4"
                    aria-label={`See ${plan.name} details`}
                  >
                    {plan.name}
                  </button>
                  <span className="block text-xs text-black/65">
                    {plan.inquiry ? "By inquiry" : `$${plan.priceMonthly} / month`}
                  </span>
                </th>
                <td className="py-4 align-top leading-relaxed text-black/70">
                  {GUIDANCE[plan.slug]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs leading-relaxed text-black/60">
          Coming-soon features are planned and are not included as available today. The Private
          Atelier is arranged separately from the app trial.
        </p>
      </div>
    </section>
  );
}
