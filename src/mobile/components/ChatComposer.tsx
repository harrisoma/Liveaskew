import { useLayoutEffect, useRef } from "react";
import { shouldSendChat } from "../lib/chat-keyboard";
import { ArrowUp, LoaderCircle } from "lucide-react";

export function ChatComposer({
  value,
  onChange,
  onSend,
  sending,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  label: string;
  placeholder: string;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (!field.current) return;
    field.current.style.height = "auto";
    field.current.style.height = `${Math.min(field.current.scrollHeight, 144)}px`;
  }, [value]);
  return (
    <form
      className="la-chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!sending && value.trim()) onSend();
      }}
    >
      <textarea
        ref={field}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={1}
        placeholder={placeholder}
        className="neo-input resize-none"
        onKeyDown={(event) => {
          if (
            shouldSendChat(
              event.nativeEvent,
              window.matchMedia("(hover: hover) and (pointer: fine)").matches,
            )
          ) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <button
        type="submit"
        className="la-send-button"
        disabled={sending || !value.trim()}
        aria-label={sending ? "Bee is responding" : "Send to Bee"}
      >
        {sending ? (
          <LoaderCircle size={20} className="la-sending-icon" aria-hidden="true" />
        ) : (
          <ArrowUp size={20} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
