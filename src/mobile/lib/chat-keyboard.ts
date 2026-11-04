/** Safari can end composition before keydown; 229 still marks the IME confirmation. */
export function shouldSendChat(
  event: { key: string; shiftKey: boolean; isComposing: boolean; keyCode: number },
  desktop: boolean,
): boolean {
  return (
    desktop &&
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing &&
    event.keyCode !== 229
  );
}
