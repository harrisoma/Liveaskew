export const PRIVACY_UPDATED = "November 24, 2026";

export const PRIVACY_TITLE = "Privacy Policy | LiveAskew (Bee, Honey, Buzz and The Hive)";

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
      "Your name and email from email, Google or Apple sign-in, plus an optional phone number and social handles you choose to save (Apple can hide your real email). Saving a handle does not connect a social account.",
      "Your membership tier and billing status. Payments are processed by Stripe; LiveAskew never sees or stores card numbers.",
    ],
  },
  {
    title: "Bee: styling",
    paragraphs: [
      "Your Fit, Feel, and Fabric interview answers, the looks Bee writes for you, the looks you save, and your chat with Bee.",
      "A styling photo, used to create AI outfit previews of you. When you choose to build your guide and previews, your photo is sent to Onixus AI and its image provider for all seven looks, including shoes and accessories. Previews are approximations and may have errors; they are not a fit guarantee. Private renders are cached to avoid duplicate generation. To finish your seven previews even when you leave the page, your reference photo is held in private server storage while the guide runs, for at most 24 hours. The reference is deleted when the guide finishes or expires; your completed previews stay in your account.",
      "Wardrobe Reset photos, used only to identify each garment and suggest Keep, Toss, or Maybe.",
    ],
  },
  {
    title: "Honey: your calendar",
    paragraphs: [
      "Events you add, and events from a Google, iCloud, or Outlook calendar link you choose to connect. We read the next 60 days from that link on our server; the link itself stays on your device.",
      "Bee uses an event's title and date only to suggest what to wear to it.",
    ],
  },
  {
    title: "Buzz: social posting",
    paragraphs: [
      "When you connect Instagram, Facebook, LinkedIn, X, or Threads, that network gives us a sign-in token for your account. We keep it encrypted, only our server can read it, and it is used only to publish the posts you schedule. Disconnect any network in Buzz at any time.",
      "Captions, post times, and the photo for each post. Post photos are stored at a public web address so the network can fetch them; anyone with that exact address can open the photo.",
      "When you ask Bee to write a caption, selected style preferences and the chosen look are sent through our AI service. You can edit the result before scheduling; your private interview is not posted to social networks.",
      "Once published, a post is governed by that network's own privacy policy.",
    ],
  },
  {
    title: "The Hive: community",
    paragraphs: [
      "The Hive name you choose, the messages you post, and any look you share into a room. Main-network posts and public-group messages are visible to signed-in members; private-group messages are limited to group members and authorized moderation. Group names, descriptions, membership and invitation records are also stored. Your email and phone number are never shown.",
      "Reports and blocks you make. Reports are read by LiveAskew moderators; three reports hide a message until it is reviewed, and moderators may remove messages or stop an account from posting.",
    ],
  },
  {
    title: "Notifications and devices",
    paragraphs: [
      "A push token, only if you turn notifications on. It is used for a new Bee recommendation, trial reminders, or a tier upgrade, never marketing blasts.",
      "Bee keeps a copy of your answers, looks, chat, and calendar on the device so it still opens offline.",
      "We count how often each AI feature is used per account to keep fair limits and costs in check.",
    ],
  },
  {
    title: "Assistants and the Chrome extension",
    paragraphs: [
      "You can connect LiveAskew to an AI assistant (such as Claude or ChatGPT) or to the LiveAskew Chrome extension. Nothing connects until you sign in and choose Allow.",
      "A connected assistant can read your style profile, your looks, and your Honey calendar, and can ask Bee questions for you. It cannot change your wardrobe, post to Buzz, or see your photos. What it does with that answer is governed by that assistant's own privacy policy.",
      "The Chrome extension only sees a page when you right-click it and choose to ask Bee; it then sends the page title, address, and any text you selected. It does not read your browsing in the background.",
      "Each connection holds a token we store only in hashed form. Disconnect it in the assistant, sign out of the extension, or delete your account to end it.",
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
      "Delete your account in Settings → Delete account. After confirmation, we cancel linked Stripe subscriptions, remove account photos, then delete your account and associated profile, looks, calendar, Hive messages and social connections. Groups you own and their conversations are also removed. If a step fails, your account remains so you can retry; earlier cleanup steps may already have completed. Copies on the current device are cleared after successful deletion. Other devices may retain offline copies until you sign out or clear their app data.",
      "Turn notifications off in You, disconnect social accounts in Buzz, and delete your own Hive messages from the message menu.",
      "To request deletion outside the app, use the Delete your LiveAskew account section at https://www.liveaskew.com/privacy#delete-account, or email hello@liveaskew.co from your account email. We verify ownership before acting; never send a password. Financial records required for accounting may remain with the payment processor. Published social posts must be removed on their respective networks.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "LiveAskew is not directed at children under 13, and we do not knowingly collect their data.",
    ],
  },
];
