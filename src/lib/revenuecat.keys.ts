/**
 * RevenueCat public SDK keys.
 *
 * These are *publishable* keys (safe in client code) — the same kind you paste
 * into a mobile app bundle. Find them in RevenueCat → Project Settings → API
 * keys → "SDK API keys". Leave a value empty to keep that platform disabled.
 *
 * - `appl_…`  iOS (added once an App Store app exists in RevenueCat)
 * - `goog_…`  Android (added once a Play app exists in RevenueCat)
 * - `test_…`  RevenueCat "Test Store" — sandbox only, used as a fallback so
 *             native builds can exercise the purchase flow before the real
 *             store apps are configured. Never charges real money.
 */
export const REVENUECAT_IOS_PUBLIC_KEY = '';
export const REVENUECAT_ANDROID_PUBLIC_KEY = '';

/** Test Store key — sandbox fallback for both platforms. */
export const REVENUECAT_TEST_STORE_KEY = 'test_bJqYnLRRKmqwUpDOsBPTywjKfdz';
