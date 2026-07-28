# Rizzla AI — Mobile & Desktop App Builds

The web app stays the single source of truth. The native apps are thin shells
that load `https://rizzlachat.com`, so **every web deploy updates the installed
apps instantly** — no store resubmission for UI or content changes.

Configuration lives in `capacitor.config.ts` (app id `com.kolotechnology.rizzla`).

---

## 0. Store-readiness checklist (already implemented in code)

| Requirement | Status | Where |
| --- | --- | --- |
| 18+ age gate + ID/selfie KYC within 7 days | Done | `/verify`, `KycGate` |
| In-app account deletion (Apple 5.1.1(v), Play data deletion) | Done | Profile → “Delete my account” (`src/lib/account.functions.ts`) |
| No external purchase links inside the iOS build (Apple 3.1.1) | Done | `useIosBillingRestricted()` hides Stripe CTAs on `/coins` and `/upgrade` |
| Privacy Policy + Terms reachable without an account | Done | `/legal/privacy`, `/legal/terms` |
| Report / block users + 24h moderation (Apple 1.2) | Done | `SafetyMenu` in chats & profiles, blocked list in Profile, `/admin/reports` |
| Content policy | Done | `/legal/acceptable-use`, `/legal/trust` |

| Support contact | Done | rizzchatsupport@gmail.com, `/legal/contact` |
| Safe-area insets, status bar, hardware back button, haptics | Done | `src/lib/native.ts`, `src/styles.css` |
| PWA manifest + icons (Windows/PWABuilder) | Done | `public/manifest.webmanifest` |

Before each store submission: publish the web app first (native shells load the
live site), then verify the shell against production.

---

## 1. iOS (Apple App Store)

Requires a Mac with Xcode + an Apple Developer account ($99/yr).

```bash
git clone <your repo>   # export project to GitHub first, then clone locally
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Signing & Capabilities → select your Team.
2. Set the app icon (use `public/icon-512.png`, exported to a 1024×1024 icon set)
   and the launch screen background `#0B0B12`.
3. Info.plist: add `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`
   ("Used to upload your profile photo, videos and ID verification selfie").
4. Product → Archive → Distribute App → App Store Connect.

App Store Connect:
- Age rating **17+/18+**; declare frequent/intense mature themes.
- Data safety: photos, ID documents, chat content, payment records.
- Review notes: reviewer account `stripe.review@rizzlachat.com` (pre-verified KYC),
  describe the paid Friends List model and that purchases are web-only in the iOS build.

**Billing:** the iOS build hides all coin/membership purchase entry points, so no
StoreKit products are required. If you later want to sell inside iOS, add StoreKit
IAP products and flip `useIosBillingRestricted()` to allow them.

## 2. Android (Google Play)

Requires Android Studio + a Play Console account ($25 one-time).

```bash
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio: set adaptive icons, then Build → Generate Signed Bundle (AAB).
Keep the keystore safe — it can never be replaced.

In Play Console:
- Content rating: **Mature 17+**; complete the Data safety form (photos, ID docs,
  messages, purchase history; data is encrypted in transit and deletable in-app).
- Add the account deletion URL: `https://rizzlachat.com/profile`.
- Play billing: Google allows external payments for user-to-user services, but if
  Play flags coins as digital goods, gate them the same way as iOS.

## 3. Windows (Microsoft Store)

The app already ships a PWA manifest, so Windows packaging goes through PWABuilder:

1. Go to https://www.pwabuilder.com and enter `https://rizzlachat.com`.
2. Choose **Windows** → Generate package (MSIX).
3. Reserve the app name in Partner Center and upload the MSIX.

Users can also install directly from Edge/Chrome via "Install app".

## 4. Store listing copy

- **Name:** Rizzla AI
- **Subtitle:** Real conversations with verified hosts
- **Description:** Rizzla AI is an 18+ social chat app where members join a host's
  Friends List for private chats, group rooms and gifts. Every account passes ID
  verification, hosts set their own price, and payments are handled securely.
- **Keywords:** chat, social, creators, friends list, rooms, gifts, dating chat
- **Support URL:** https://rizzlachat.com/legal/contact
- **Privacy URL:** https://rizzlachat.com/legal/privacy
