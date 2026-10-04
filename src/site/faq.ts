/**
 * Questions people actually type into Google (and ask AI assistants) about a styling app.
 * Shown on the website and published as FAQ structured data. Written in the LiveAskew voice
 * (docs/VOICE.md), and only claims what is live today.
 */
import { TIERS } from "@/mobile/lib/tiers";

const silver = TIERS.find((t) => t.slug === "silver")?.priceMonthly ?? 20;

export const FAQ: { q: string; a: string }[] = [
  {
    q: "What is an AI personal stylist?",
    a: "It's a stylist in your pocket. Bee asks how you like your clothes to fit, how you want to feel and which fabrics you love, then tells you exactly what to wear: the pieces, the fabric and why they work for your day. Like a friend with great taste who's always free.",
  },
  {
    q: "Can Bee tell me what to wear today?",
    a: "That's her favourite question. Tell her what's on (the school run, a big meeting, dinner out) or connect your calendar to Honey, and Bee picks an outfit for each event before you've finished your coffee.",
  },
  {
    q: "Does it work with clothes I already own?",
    a: "Yes. Wardrobe Reset goes through your closet with you: keep, toss or maybe. Bee styles outfits from what you keep and only suggests the one piece that's actually missing.",
  },
  {
    q: "Will Bee change how my body looks?",
    a: "Never. When Bee shows a look on your photo, there's no slimming, smoothing or reshaping. Clothes should fit you, not the other way round. It works for every size, shape, age and style, including modest and heritage dressing.",
  },
  {
    q: "Who is LiveAskew for?",
    a: "LiveAskew is based in Miami and made for women of every age, body and personal style. From dresses and shirts to tailoring, streetwear and modest looks, Bee starts with your preferences and the life you lead.",
  },
  {
    q: "Can I schedule my outfit posts to Instagram and other socials?",
    a: "Yes. Buzz writes a caption in your voice and posts your look to Instagram, Facebook, LinkedIn, X or Threads at the time you choose, and it shows up on your Honey calendar too.",
  },
  {
    q: "How much does LiveAskew cost?",
    a: `Try Bee for 14 days without entering payment details. Paid memberships are optional; Silver is $${silver} a month. If you subscribe, checkout shows the first charge date and your membership renews monthly until cancelled. Manage or cancel it in You → Membership → Change or cancel membership. The Private Atelier, with a real human stylist, is priced with you after a chat.`,
  },
  {
    q: "What happens when I get started?",
    a: "Sign in with Google or Apple, complete the account check, then answer five short questions about your life and style. Add a clear full-length photo to build your first Style Guide. Your free trial starts with your first AI use; starting a paid membership does not restart it.",
  },
  {
    q: "Is there an iPhone or Android app?",
    a: "Bee works in your browser today on any phone or computer, and you can add it to your home screen. The iPhone and Android apps are coming soon. You can also use Bee inside Claude and ChatGPT.",
  },
  {
    q: "Is my data private?",
    a: "We never sell your data. AI providers receive the text or images needed for features you use, including try-on. You can delete your account in the app. Our privacy policy explains photo processing, storage and connected accounts.",
  },
];
