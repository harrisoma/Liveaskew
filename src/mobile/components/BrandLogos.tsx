import type { ConnectDoorId } from "@/lib/buzz";

export function BrandLogo({ id }: { id: ConnectDoorId }) {
  if (id === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.7 10.3 21.4 2h-1.6l-5.8 7.2L9.2 2H2.5l7.1 10.8L2.5 22h1.6l6.2-7.7L14.8 22h6.7l-6.8-11.7Zm-2.2 2.7-.7-1.1L4.7 3.3h2.5l4.6 6.9.7 1.1 6 9.1h-2.5l-4.5-6.4Z"
        />
      </svg>
    );
  }
  if (id === "threads") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.5 11.4c-.2-2.6-1.6-4.3-4.3-4.4-2.4 0-3.9 1.4-4.2 3.6h2.1c.2-1 .9-1.6 2-1.6 1.4 0 2.2.8 2.3 2.2-.7-.1-1.5-.1-2.2 0-2.6.3-4.2 1.6-4.2 3.8 0 2.2 1.7 3.6 4.1 3.6 2 0 3.4-.8 4.1-2.3.4 1.3 1.4 2.1 3 2.1 1.1 0 1.8-.4 1.8-1.2 0-.6-.4-1-1.2-1.1-.9-.1-1.5.2-1.8.8-.5 1-1.4 1.6-2.7 1.6-1.5 0-2.5-.8-2.5-2.1 0-1.4 1.1-2.2 3.2-2.5.8-.1 1.6-.1 2.3 0v-.5Zm-2.1 2.5c-1.2.2-2 .6-2 1.4 0 .7.6 1.2 1.4 1.2 1 0 1.7-.6 1.8-1.6v-.7c-.4-.2-.8-.3-1.2-.3Z"
        />
      </svg>
    );
  }
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
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (id === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.2 21v-7.1h2.4l.4-2.8h-2.8V9.3c0-.8.2-1.4 1.4-1.4H17V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2h-2.5v2.8H11V21h3.2Z"
        />
      </svg>
    );
  }
  if (id === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#25F4EE"
          d="M14.2 4.2c.7 1.5 1.8 2.6 3.3 3.1v2.2a6.2 6.2 0 0 1-3.3-1v5.7a5.4 5.4 0 1 1-5.4-5.4c.2 0 .5 0 .7.1v2.4a3 3 0 1 0 2.1 2.9V4.2h2.6Z"
        />
        <path
          fill="#FE2C55"
          d="M13.4 4.2c.7 1.5 1.8 2.6 3.3 3.1v2.2a6.2 6.2 0 0 1-3.3-1v5.7a5.4 5.4 0 1 1-5.4-5.4c.2 0 .5 0 .7.1v2.4a3 3 0 1 0 2.1 2.9V4.2h2.6Z"
        />
        <path
          fill="#fff"
          d="M13.8 4.6c.6 1.4 1.7 2.4 3.1 2.9v1.8a6 6 0 0 1-3.1-.9v5.5a5 5 0 1 1-5-5c.2 0 .4 0 .6.1v2.2a2.8 2.8 0 1 0 2 2.7V4.6h2.4Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 9.2H4V20h2.5V9.2ZM5.2 4C4.3 4 3.6 4.7 3.6 5.6S4.3 7.2 5.2 7.2 6.8 6.5 6.8 5.6 6.1 4 5.2 4ZM20 20h-2.5v-5.6c0-1.5-.5-2.5-1.9-2.5-1 0-1.6.7-1.8 1.3-.1.2-.1.6-.1.9V20H11.2s.1-9.3 0-10.8h2.5v1.5c.3-.5 1.2-1.8 3.1-1.8 2.2 0 3.2 1.5 3.2 4.4V20Z"
      />
    </svg>
  );
}
