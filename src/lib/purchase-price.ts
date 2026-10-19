/** Native purchases must never display a web price as a store-price fallback. */
export function purchaseDisplayPrice(native: boolean, webPrice: string, storePrice?: string): string {
  return native ? storePrice || "Unavailable" : webPrice;
}