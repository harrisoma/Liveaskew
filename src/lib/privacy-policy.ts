export const PRIVACY_UPDATED = "September 30, 2026";

export const PRIVACY_TITLE = "Privacy Policy — LiveAskew (Bee, Honey, Buzz, and the Hive)";

export const PRIVACY_INTRO =
  "LiveAskew is one app with four parts: Bee styles you, Honey keeps your calendar, Buzz shares your looks to social networks you connect, and the Hive is where members talk. This page says what each part collects, why, who else sees it, and how to delete it. We never sell your data, and styling photos are never used to slim, reshape, or beautify your body.";

export const PRIVACY_SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "Who this covers",
    paragraphs: [
      "The LiveAskew web app, the iOS and Android apps (co.liveaskew.app), and the service behind them. This is the public privacy URL for the App Store and Google Play.",
    ],
  },
  {
    title: "Your account",
    paragraphs: [
      "Email from Google or Apple sign-in, and a phone number if you verify by text (Apple can hide your real email).",
      "Your membership tier and billing status. Payments are processed by Stripe; LiveAskew never sees or stores card numbers.",
    ],
  },
  {
    title: "Bee — styling",
    paragraphs: [
      "Your Fit, Feel, and Fabric interview answers, the looks Bee writes for you, the looks you save, and your chat with Bee.",
      "An optional styling photo, used only to show looks on your body as photographed. Try-on renders are cached so they are not made twice.",
      "Wardrobe Reset photos, used only to identify each garment and suggest Keep, Toss, or Maybe.",
    ],
  },
  {
    title: "Honey — your calendar",
    paragraphs: [
      "Events you add, and events from a Google, iCloud, or Outlook calendar link you choose to connect. We read the next 60 days from that link on our server; the link itself stays on your device.",
      "Bee uses an event's title and date only to suggest what to wear to it.",
    ],
  },
  {
    title: "Buzz — social posting",
    paragraphs: [
      "When you connect Instagram, Facebook, LinkedIn, X, or Threads, that network gives us a sign-in token for your account. We keep it encrypted, only our server can read it, and it is used only to publish the posts you schedule. Disconnect any network in Buzz at any time.",
      "Captions, post times, and the photo for each post. Post photos are stored at a public web address so the network can fetch them; anyone with that exact address can open the photo.",
      "Once published, a post is governed by that network's own privacy policy.",
    ],
  },
  {
    title: "The Hive — community",
    paragraphs: [
      "The Hive name you choose, the messages you post, and any look you share into a room. Other signed-in members can read them. Your email and phone number are never shown.",
      "Reports and blocks you make. Reports are read by LiveAskew moderators; three reports hide a message until it is reviewed, and moderators may remove messages or stop an account from posting.",
    ],
  },
  {
    title: "Notifications and devices",
    paragraphs: [
      "A push token, only if you turn notifications on — used for a new Bee recommendation, trial reminders, or a tier upgrade, never marketing blasts.",
      "Bee keeps a copy of your answers, looks, chat, and calendar on the device so it still opens offline.",
      "We count how often each AI feature is used per account to keep fair limits and costs in check.",
    ],
  },
  {
    title: "Who we share with",
    paragraphs: [
      "Supabase (database, sign-in, and file storage) and Vercel (hosting) run the service for us.",
      "AI providers receive only the text or images needed to answer your chat, write a look, identify a garment, or render a try-on that keeps your proportions.",
      "Apple Push Notification service and Firebase Cloud Messaging receive only your device token and the notification text.",
      "Stripe processes payments. Social networks receive the posts you choose to publish.",
      "We do not sell your data or share it for advertising.",
    ],
  },
  {
    title: "Your controls",
    paragraphs: [
      "Delete your account any time in You → Delete account. This cancels any membership and permanently removes your profile, looks, photos, calendar, Hive messages, and connected social accounts. Copies on your device are cleared at the same time.",
      "Turn notifications off in You, disconnect social accounts in Buzz, and delete your own Hive messages from the message menu.",
      "Questions or requests: hello@liveaskew.co.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "LiveAskew is not directed at children under 13, and we do not knowingly collect their data.",
    ],
  },
];
