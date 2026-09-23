export const TRIAL_DAYS = 14;

export function trialDaysLeft(startedAt: string | null, now = Date.now()): number | null {
  if (!startedAt) return null;
  const start = Date.parse(startedAt);
  if (Number.isNaN(start)) return null;
  const elapsed = now - start;
  const remainingMs = TRIAL_DAYS * 24 * 60 * 60 * 1000 - elapsed;
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export function trialActive(startedAt: string | null, now = Date.now()): boolean {
  const days = trialDaysLeft(startedAt, now);
  return days !== null && days > 0;
}

export function trialLabel(startedAt: string | null, now = Date.now()): string | null {
  const days = trialDaysLeft(startedAt, now);
  if (days === null) return null;
  if (days <= 0) return "Trial ended — membership unlocks new looks";
  if (days === 1) return "1 day left in your free trial";
  return `${days} days left in your free trial`;
}

/** During trial: unlimited looks. After day 14: paid metal tier required. */
export function canGenerateLook(opts: {
  trialStartedAt: string | null;
  membershipActive: boolean;
  now?: number;
}): boolean {
  if (trialActive(opts.trialStartedAt, opts.now)) return true;
  return opts.membershipActive;
}
