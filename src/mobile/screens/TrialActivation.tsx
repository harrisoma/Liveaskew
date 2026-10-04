import { useEffect, useState } from "react";
import { NeoButton, Screen } from "../components/ui";
import { fetchMembership, openBillingPortal, startCheckout, type Membership } from "../lib/billing";
import { TIERS, type PlanSlug } from "../lib/tiers";

export function TrialActivation({ onContinue }: { onContinue: () => void }) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [tier, setTier] = useState<PlanSlug>("silver");
  const [accepted, setAccepted] = useState(false);
  const plan = TIERS.find((item) => item.slug === tier)!;
  async function refresh() {
    setLoading(true);
    const result = await fetchMembership();
    setMembership(result);
    setLoading(false);
    if (!result)
      setNotice("I could not confirm your membership. Please check again before continuing.");
    else setNotice("");
  }
  useEffect(() => {
    void refresh();
  }, []);
  const unlocked = membership?.active || membership?.legacyTrialActive;
  return (
    <Screen
      kicker="Bee · Finish your setup"
      title={unlocked ? "You’re ready to style" : "Let’s activate your membership"}
    >
      <div className="neo-inset mb-5 p-4 text-sm leading-relaxed">
        <p className="font-semibold">Bee</p>
        <p className="mt-2">
          {unlocked
            ? "Your access is confirmed. Let’s build your first Style Guide."
            : "Your style preferences are ready. Choose your membership, then enter your card on Stripe’s secure page. I will be here when you return."}
        </p>
      </div>
      {loading ? (
        <p role="status">Checking your membership…</p>
      ) : unlocked ? (
        <>
          <NeoButton variant="gold" onClick={onContinue}>
            Continue to my Style Guide
          </NeoButton>
          {membership?.active && (
            <NeoButton
              className="mt-3"
              onClick={async () => {
                const result = await openBillingPortal();
                if (result) setNotice(result.error);
              }}
            >
              Manage or cancel membership
            </NeoButton>
          )}
        </>
      ) : membership ? (
        <>
          <label htmlFor="activation-tier" className="mb-2 block font-semibold">
            Choose your monthly plan
          </label>
          <select
            id="activation-tier"
            value={tier}
            disabled={busy}
            onChange={(event) => {
              setTier(event.target.value as PlanSlug);
              setAccepted(false);
            }}
            className="mb-4 w-full rounded-xl border border-black/20 bg-white p-3 text-black"
          >
            {TIERS.filter((item) => !item.inquiry).map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name} — ${item.priceMonthly}/month
              </option>
            ))}
          </select>
          <p className="mb-4 text-sm leading-relaxed">
            {membership.trialEligible
              ? `14 days free, then $${plan.priceMonthly}/month unless you cancel. Your trial begins when checkout is completed. Add your credit or debit card securely in Stripe; do not send it in chat.`
              : `This account is not eligible for a new free trial. ${plan.name} is $${plan.priceMonthly}/month, billed when you subscribe. Review the final amount and date in checkout.`}
          </p>
          <p className="mb-4 text-sm">
            Manage or cancel in You → Membership → Change or cancel membership.
          </p>
          <label className="mb-5 flex items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span>
              {membership.trialEligible
                ? `I understand my card will be charged $${plan.priceMonthly}/month after 14 days unless I cancel before the trial ends.`
                : `I understand this is a paid subscription at $${plan.priceMonthly}/month, with no new free trial.`}
            </span>
          </label>
          <NeoButton
            variant="gold"
            disabled={busy || !accepted}
            onClick={async () => {
              setBusy(true);
              setNotice("");
              const result = await startCheckout(tier, { trialOnly: membership.trialEligible });
              if (result) setNotice(result.error);
              setBusy(false);
            }}
          >
            {busy
              ? "Opening secure checkout…"
              : membership.trialEligible
                ? "Add card & start my 14-day trial"
                : "Continue to paid checkout"}
          </NeoButton>
          <p className="mt-4 text-xs leading-relaxed">
            Already completed checkout? Confirmation can take a moment. Cancelled or declined
            checkout does not activate your trial.
          </p>
        </>
      ) : null}
      {!unlocked && (
        <NeoButton className="mt-4" disabled={loading || busy} onClick={() => void refresh()}>
          Check activation again
        </NeoButton>
      )}
      {notice && (
        <p role="alert" className="mt-4 text-sm">
          {notice}
        </p>
      )}
    </Screen>
  );
}
