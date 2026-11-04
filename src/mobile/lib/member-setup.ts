import { z } from "zod";
import { TIERS } from "./tiers";

/** US/Canada is the displayed default; explicit international codes are preserved. */
export function normalizeMemberPhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !/^[+\d\s().-]+$/.test(trimmed)) return trimmed;
  const compact = trimmed.replace(/[\s().-]/g, "");
  if (/^[2-9]\d{2}[2-9]\d{6}$/.test(compact)) return `+1${compact}`;
  if (/^1[2-9]\d{2}[2-9]\d{6}$/.test(compact)) return `+${compact}`;
  return compact;
}

export const memberSetupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  phone: z
    .string()
    .transform(normalizeMemberPhone)
    .refine(
      (value) => !value || /^\+[1-9]\d{6,14}$/.test(value),
      "Enter a US/Canada number or an international number starting with + and its country code. You can also leave this blank.",
    ),
  socials: z.object({
    Instagram: z.string().trim().max(160).default(""),
    TikTok: z.string().trim().max(160).default(""),
    Facebook: z.string().trim().max(160).default(""),
    X: z.string().trim().max(160).default(""),
    LinkedIn: z.string().trim().max(160).default(""),
    YouTube: z.string().trim().max(160).default(""),
    Threads: z.string().trim().max(160).default(""),
  }),
  selectedPlan: z
    .string()
    .refine(
      (value) => TIERS.some((tier) => tier.slug === value && !tier.inquiry),
      "Choose a membership.",
    ),
});

export type MemberSetup = z.infer<typeof memberSetupSchema>;
export const blankMemberSetup: MemberSetup = {
  name: "",
  phone: "",
  selectedPlan: "silver",
  socials: {
    Instagram: "",
    TikTok: "",
    Facebook: "",
    X: "",
    LinkedIn: "",
    YouTube: "",
    Threads: "",
  },
};

/** Preferences only: user-editable metadata must never grant paid access. */
export async function readMemberSetup(): Promise<MemberSetup | null> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    const parsed = memberSetupSchema.safeParse(data.user?.user_metadata?.memberSetup);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveMemberSetup(value: MemberSetup): Promise<boolean> {
  const parsed = memberSetupSchema.safeParse(value);
  if (!parsed.success) return false;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.updateUser({ data: { memberSetup: parsed.data } });
    return !error;
  } catch {
    return false;
  }
}
