/** Keep likely card numbers out of AI requests. Checkout owns payment details. */
export function containsPaymentDetails(text: string): boolean {
  return (
    /(?:\d[ -]?){13,19}/.test(text) ||
    /\b(?:cvv|cvc|security code)\s*[:=-]?\s*\d{3,4}\b/i.test(text)
  );
}
