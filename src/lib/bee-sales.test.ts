import { describe, expect, it } from "vitest";
import { containsPaymentDetails } from "./bee-sales";
describe("sales chat payment protection", () => {
  it("blocks common card and security-code formats before AI submission", () => {
    for (const text of [
      "4242424242424242",
      "4242 4242 4242 4242",
      "4242-4242-4242-4242",
      "CVV: 123",
      "security code 1234",
    ])
      expect(containsPaymentDetails(text)).toBe(true);
  });
  it("allows ordinary trial and price questions", () => {
    expect(containsPaymentDetails("Is the trial 14 days and Silver $20 per month?")).toBe(false);
  });
});
