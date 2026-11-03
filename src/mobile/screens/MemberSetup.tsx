import { useState } from "react";
import { NeoButton, NeoField, Screen } from "../components/ui";
import {
  blankMemberSetup,
  memberSetupSchema,
  saveMemberSetup,
  type MemberSetup,
} from "../lib/member-setup";
import { TIERS } from "../lib/tiers";

export function MemberSetupScreen({
  email,
  initial,
  onDraft,
  onComplete,
}: {
  email: string | null;
  initial: MemberSetup | null;
  onDraft: (value: MemberSetup) => void;
  onComplete: (value: MemberSetup) => void;
}) {
  const [profile, setProfile] = useState(initial ?? blankMemberSetup);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function update(next: MemberSetup) {
    setProfile(next);
    onDraft(next);
  }
  return (
    <Screen kicker="Bee · Your details" title="Let’s make this yours">
      <p className="mb-4">
        Your account is verified{email ? ` as ${email}` : ""}. Tell Bee what to call you, then we’ll
        explore your style.
      </p>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const parsed = memberSetupSchema.safeParse(profile);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          setBusy(true);
          setError("");
          const saved = await saveMemberSetup(parsed.data);
          setBusy(false);
          if (!saved) {
            setError(
              "Your details could not be saved. Try again—you do not need to verify your account again.",
            );
            return;
          }
          onComplete(parsed.data);
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          <label className="block">
            Your name
            <NeoField
              autoComplete="name"
              required
              maxLength={100}
              value={profile.name}
              onChange={(e) => update({ ...profile, name: e.target.value })}
            />
          </label>
          <label className="block">
            Phone number (optional)
            <NeoField
              type="tel"
              autoComplete="tel"
              placeholder="+13055550123"
              maxLength={16}
              value={profile.phone}
              onChange={(e) => update({ ...profile, phone: e.target.value })}
            />
          </label>
          <details className="neo-inset p-4">
            <summary>Add social handles (optional)</summary>
            <p className="my-3 text-sm">
              This saves your handles. It does not connect accounts or authorize posting.
            </p>
            {(Object.keys(blankMemberSetup.socials) as Array<keyof MemberSetup["socials"]>).map(
              (network) => (
                <label key={network} className="mb-3 block">
                  {network}
                  <NeoField
                    maxLength={160}
                    value={profile.socials[network]}
                    onChange={(e) =>
                      update({
                        ...profile,
                        socials: { ...profile.socials, [network]: e.target.value },
                      })
                    }
                  />
                </label>
              ),
            )}
          </details>
          <label className="block">
            Which membership interests you?
            <select
              className="neo-inset mt-2 w-full p-3"
              value={profile.selectedPlan}
              onChange={(e) => update({ ...profile, selectedPlan: e.target.value })}
            >
              {TIERS.filter((tier) => !tier.inquiry).map((tier) => (
                <option key={tier.slug} value={tier.slug}>
                  {tier.name} · ${tier.priceMonthly}/month
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm">
            This saves your preference only. No charge or subscription starts here. You can review
            and change your membership under You.
          </p>
          <p className="text-sm">
            Your details are used for your account.{" "}
            <a href="/privacy" className="underline">
              Privacy policy
            </a>
          </p>
          {error && <p role="alert">{error}</p>}
          <NeoButton type="submit" variant="gold" disabled={busy}>
            {busy ? "Saving your details…" : "Continue to my style interview"}
          </NeoButton>
        </fieldset>
      </form>
    </Screen>
  );
}
