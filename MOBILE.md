# Crush — Mobile & Desktop App Builds

The web app stays the single source of truth. The native apps are thin shells
that load `https://rizzlachat.com`, so **every web deploy updates the installed
apps instantly** — no store resubmission for UI or content changes.

Configuration lives in `capacitor.config.ts` (app id `com.kolotechnology.crush`).

---

## 0. Store-readiness checklist (already implemented in code)

| Requirement | Status | Where |
| --- | --- | --- |
| 18+ age gate + ID/selfie KYC within 7 days | Done | `/verify`, `KycInboxNotice` |
| In-app account deletion (Apple 5.1.1(v), Play data deletion) | Done | Profile → “Delete my account” (`src/lib/account.functions.ts`) |
| No external purchase links inside the iOS build (Apple 3.1.1) | Done | `useIosBillingRestricted()` hides Stripe CTAs on `/coins` and `/upgrade` |
| Privacy Policy + Terms reachable without an account | Done | `/legal/privacy`, `/legal/terms` |
| Report / block users + 24h moderation (Apple 1.2) | Done | `SafetyMenu` in chats & profiles, blocked list in Profile, `/admin/reports` |
| Content policy | Done | `/legal/acceptable-use`, `/legal/trust` |

| Support contact | Done | rizzchatsupport@gmail.com, `/legal/contact` |
| Safe-area insets, status bar, hardware back button, haptics | Done | `src/lib/native.ts`, `src/styles.css` |
| Native camera capture (avatar + profile media) | Done | `captureNativePhoto()` in `src/lib/native.ts`, Profile page |
| Push notifications opt-in + device token storage | Done | `PushNotificationsCard`, `public.push_devices` |
| PWA manifest + icons (Windows/PWABuilder) | Done | `public/manifest.webmanifest` |

### Push notifications — native setup

The web app registers the device and stores the APNs/FCM token in
`public.push_devices` (one row per device, user-scoped). Native side:

- **iOS**: enable the *Push Notifications* capability and *Background Modes →
  Remote notifications* in Xcode, upload an APNs key in the Apple Developer
  portal, and add `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription`.
- **Android**: add `google-services.json` from a Firebase project to
  `android/app/`; Capacitor wires FCM automatically.

Send pushes from the backend by reading `push_devices` and calling APNs/FCM.
Include `{ "link": "/chats" }` in the payload to deep-link on tap.


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

In Android Studio: set adaptive icons (`public/icon-512.png`), target the latest
required API level, then Build → Generate Signed Bundle (AAB). Keep the keystore
safe — it can never be replaced.

### Play policy checklist (implemented in code)

| Play requirement | Status | Where |
| --- | --- | --- |
| In-app account deletion | Done | Profile → “Delete my account” |
| Public web deletion instructions URL | Done | `https://rizzlachat.com/legal/delete-account` |
| Privacy Policy URL (public, no login) | Done | `/legal/privacy` |
| UGC policy: report, block, blocked list, moderation queue | Done | `SafetyMenu`, `/admin/reports` |
| Adult / mature content gate (18+ signup + ID KYC) | Done | `/verify`, `KycInboxNotice` |
| Hardware back button handling | Done | `src/lib/native.ts` |
| Maskable + 192/512 icons | Done | `public/manifest.webmanifest` |
| Runtime permission prompts only in context (camera, notifications) | Done | Profile page |

### In Play Console

- Content rating questionnaire: **Mature 17+** (dating/social, user interaction,
  user-generated content, in-app purchases).
- Data safety form: photos/videos, ID documents, messages, email, purchase
  history; encrypted in transit; deletable in-app.
- **Account deletion URL:** `https://rizzlachat.com/legal/delete-account`
- App access: provide a reviewer login with KYC pre-approved and coins loaded,
  otherwise review hits the verification wall.
- Declare the app as containing user-generated content and describe the
  moderation process (24h report SLA).

### Play billing

Google allows external payment for person-to-person services, so the Android
build keeps the coin/membership CTAs visible by default. If Play review
classifies coins as digital goods, rebuild with
`VITE_ANDROID_BILLING_RESTRICTED=true` — that hides every purchase CTA in the
Android build exactly like the iOS build, with zero code changes and no effect
on web or iOS.

### Permissions

`npx cap sync android` adds only what the installed plugins need: `INTERNET`,
`CAMERA`, `READ_MEDIA_IMAGES`/`READ_MEDIA_VIDEO`, and `POST_NOTIFICATIONS`.
Remove anything else Android Studio adds — unused permissions trigger Play
policy reviews.


## 3. Windows (Microsoft Store)

The app already ships a PWA manifest, so Windows packaging goes through PWABuilder:

1. Go to https://www.pwabuilder.com and enter `https://rizzlachat.com`.
2. Choose **Windows** → Generate package (MSIX).
3. Reserve the app name in Partner Center and upload the MSIX.

Users can also install directly from Edge/Chrome via "Install app".

## 4. Store listing copy

- **Name:** Crush
- **Subtitle:** Real conversations with verified hosts
- **Description:** Crush is an 18+ social chat app where members join a host's
  Friends List for private chats, group rooms and gifts. Every account passes ID
  verification, hosts set their own price, and payments are handled securely.
- **Keywords:** chat, social, creators, friends list, rooms, gifts, dating chat
- **Support URL:** https://rizzlachat.com/legal/contact
- **Privacy URL:** https://rizzlachat.com/legal/privacy
