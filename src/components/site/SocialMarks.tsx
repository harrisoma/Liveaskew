const SOCIALS = [
  "instagram",
  "tiktok",
  "pinterest",
  "facebook",
  "linkedin",
  "google",
  "apple",
] as const;

export type SocialId = (typeof SOCIALS)[number];

const NAMES: Record<SocialId, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  google: "Google",
  apple: "Apple",
};

function Mark({ id }: { id: SocialId }) {
  if (id === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16.6" cy="7.4" r="0.9" fill="currentColor" />
      </svg>
    );
  }
  if (id === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14 6.2c.7 1.6 1.8 2.6 3.4 3v2.2c-1.2 0-2.3-.4-3.4-1.1v5.4a4.7 4.7 0 1 1-4.7-4.7c.3 0 .6 0 .9.1v2.3a2.4 2.4 0 1 0 1.6 2.3V6.2H14Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (id === "pinterest") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M10.2 17.2c.3-1.1.6-2.2.8-3.3-.5-.8-.7-1.8-.4-2.8.4-1.2 1.6-1.8 2.7-1.5 1.2.3 1.8 1.5 1.6 2.8-.2 1.5-1.3 2.6-2.6 2.5-.4 0-.7-.1-.8-.2.2.8.5 1.6.7 2.5h-2Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (id === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M13.4 18v-5.2h1.8l.3-2h-2.1V9.5c0-.6.2-1 .9-1H15.6V6.7c-.3 0-.9-.1-1.7-.1-1.7 0-2.8 1-2.8 2.9v1.3H9.4v2h1.7V18h2.3Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (id === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="10" width="3" height="8" fill="currentColor" />
        <circle cx="6.5" cy="7.2" r="1.5" fill="currentColor" />
        <path
          d="M11 10h2.8v1.1c.4-.7 1.3-1.3 2.6-1.3 2.2 0 3.1 1.3 3.1 3.6V18h-3v-4.1c0-1.1-.4-1.8-1.3-1.8-.9 0-1.4.6-1.4 1.8V18H11V10Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (id === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M17.6 12.2c0-.5-.1-1-.2-1.4H12v2.7h3.2c-.1.8-.6 1.5-1.3 2v1.6h2.1c1.2-1.1 1.6-2.8 1.6-4.9Z"
          fill="currentColor"
        />
        <path
          d="M12 18.2c1.6 0 2.9-.5 3.9-1.4l-2.1-1.6c-.5.4-1.2.6-1.8.6-1.4 0-2.6-.9-3-2.2H6.8v1.7c1 2 2.9 2.9 5.2 2.9Z"
          fill="currentColor"
        />
        <path
          d="M9 13.6a3.6 3.6 0 0 1 0-2.3V9.6H6.8a6.2 6.2 0 0 0 0 5.6L9 13.6Z"
          fill="currentColor"
        />
        <path
          d="M12 8.4c.8 0 1.6.3 2.2.9l1.6-1.6C14.9 6.7 13.6 6.2 12 6.2 9.7 6.2 7.8 7.1 6.8 9.1L9 10.8c.4-1.3 1.6-2.4 3-2.4Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16.5 12.7c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.2 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2 2.5 2 1 0 1.4-.6 2.6-.6s1.5.6 2.6.6 1.7-1 2.4-2c.7-1.1 1-2.1 1-2.2-.1-.1-2-0.8-2.1-3.1ZM14.6 6.8c.5-.7.9-1.6.8-2.5-.8.1-1.7.5-2.2 1.2-.5.6-.9 1.5-.8 2.4.9 0 1.7-.5 2.2-1.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SocialMarks({ ids }: { ids: readonly SocialId[] }) {
  return (
    <ul className="social-row">
      {ids.map((id) => (
        <li key={id} className="social-mark">
          <Mark id={id} />
          <span>{NAMES[id]}</span>
        </li>
      ))}
    </ul>
  );
}
