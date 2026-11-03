import { z } from "zod";
import { TIERS } from "./tiers";

export const memberSetupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+[1-9]\d{6,14}$/.test(value),
      "Use a country code, such as +13055550123, or leave phone blank.",
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
