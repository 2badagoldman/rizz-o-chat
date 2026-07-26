# Rizzla AI — Mobile & Desktop App Builds

The web app stays the single source of truth. The native apps are thin shells
that load `https://rizzlachat.com`, so **every web deploy updates the installed
apps instantly** — no store resubmission for UI or content changes.

Configuration lives in `capacitor.config.ts` (app id `com.kolotechnology.rizzla`).

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
2. Set the app icon (use `public/icon-512.png` in an icon set) and launch screen.
3. Product → Archive → Distribute App → App Store Connect.

App Review notes to include:
- 18+ app; age gate + ID/selfie KYC within 7 days of signup.
- Reviewer account: `stripe.review@rizzlachat.com` (pre-verified).
- Set age rating to 17+/18+ and describe the paid Friends List model.
- **Important:** Apple requires in-app purchases for digital goods. Either
  add StoreKit products for coins/Gold/Diamond in the iOS build, or ship the
  iOS app without in-app purchase entry points and keep billing on the web.

## 2. Android (Google Play)

Requires Android Studio + a Play Console account ($25 one-time).

```bash
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio: set icons, then Build → Generate Signed Bundle (AAB) and
upload to Play Console. Complete the Data safety form and set content rating
to Mature 17+.

## 3. Windows (Microsoft Store)

The app already ships a PWA manifest (`public/manifest.webmanifest`) and a
service worker, so Windows packaging goes through PWABuilder — no extra code:

1. Go to https://www.pwabuilder.com and enter `https://rizzlachat.com`.
2. Choose **Windows** → Generate package (MSIX).
3. Reserve the app name in Partner Center and upload the MSIX.

Users can also install directly from Edge/Chrome via "Install app".

---

## Updating the native apps

- Content/UI change → just publish the web app. Done.
- Native config, plugins, icons, or capacitor version change →
  `npx cap sync` then rebuild and resubmit.

## Local device testing against a dev server

```bash
CAP_SERVER_URL=http://192.168.1.20:8080 npx cap sync
```
(Use your machine's LAN IP; set `cleartext: true` in `capacitor.config.ts`
temporarily for plain HTTP.)
