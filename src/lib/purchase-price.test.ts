import { describe, expect, it } from "vitest";
import { purchaseDisplayPrice } from "./purchase-price";

describe("purchase display prices", () => {
  it("uses the localized store price on native", () => {
    expect(purchaseDisplayPrice(true, "$4.99", "59,00 kr")).toBe("59,00 kr");
  });
  it("preserves the web checkout price on web", () => {
    expect(purchaseDisplayPrice(false, "$4.99", "59,00 kr")).toBe("$4.99");
  });
  it("does not substitute a web price for an unavailable native product", () => {
    expect(purchaseDisplayPrice(true, "$4.99")).toBe("Unavailable");
  });
});