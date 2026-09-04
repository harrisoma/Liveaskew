export const PRIVACY_UPDATED = "September 4, 2026";

export const PRIVACY_TITLE = "Privacy Policy — Bee by LiveAskew";

export const PRIVACY_INTRO =
  "Bee stores fit answers, saved looks, and your last chat on device so an offline session still opens. Account email is saved when you create one. Push is only for a new Bee recommendation, a trial countdown reminder, or a tier upgrade. Styling photos are never used to alter body proportions.";

export const PRIVACY_SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "Who this covers",
    paragraphs: [
      "This policy applies to the Bee mobile app (co.liveaskew.app) and the LiveAskew service that powers it. It is the public URL for the Google Play data safety form and the App Store privacy questions.",
    ],
  },
  {
    title: "What we collect",
    paragraphs: [
      "Email, if you create an account with Google or Apple.",
      "Fit, Feel, and Fabric answers from Bee’s interview, plus saved looks and chat so an offline session still opens.",
      "An optional styling photo. It is used only to dress the body as photographed — never to slim, reshape, or beautify.",
      "Wardrobe Reset photos, used only to identify the garment in the picture and judge Keep / Toss / Maybe against your profile.",
      "A device push token, only if you turn notifications on.",
    ],
  },
  {
    title: "What we do not do",
    paragraphs: [
      "We do not sell your data.",
      "We do not use styling photos to alter body proportions.",
      "Push is not used for marketing blasts. You hear from Bee when a new recommendation is ready, when trial days are running down, or when a tier upgrade is available.",
    ],
  },
  {
    title: "Where data lives",
    paragraphs: [
      "Fit answers, saved looks, and the last chat also stay on the device so Bee still opens offline.",
      "Account and styling data that syncs to the server is stored in our database with row-level access so only you can read your own rows.",
      "Photos live in private storage. Generated looks are cached so repeat visits do not regenerate.",
    ],
  },
  {
    title: "Who we share with",
    paragraphs: [
      "AI providers, only the prompt and images needed to identify a garment, write a look, or render a try-on that preserves your proportions.",
      "Firebase Cloud Messaging, only the device token needed to deliver the notifications you opted into.",
      "Payments, if you choose a membership, are processed by our payment provider. LiveAskew does not store card numbers.",
    ],
  },
  {
    title: "Your controls",
    paragraphs: [
      "Turn push off in You → notifications. Sign out clears the on-device session.",
      "To delete your account and associated styling data, email hello@liveaskew.co.",
    ],
  },
];
