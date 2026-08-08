# Crush — Store Submission Answers (Apple + Google)

Everything the developer needs to fill in App Store Connect and Play Console.
Company of record: **KOLO TECHNOLOGY LLC**, 1802 Pleasant Valley Rd, Ste 400,
Garland, TX 75040-2861, United States. Support: **rizzchatsupport@gmail.com**.
Website: **https://rizzlachat.com**

---

# 1. Apple App Store (App Store Connect)

## App Information

| Field | Value |
| --- | --- |
| App name (30) | `Crush: Chat & Meet New People` (29 chars) |
| Subtitle (30) | `Real chats with real people` (27) |
| Bundle ID | `com.kolotechnology.crush` |
| SKU | `CRUSH-IOS-001` |
| Primary language | English (U.S.) |
| Primary category | Social Networking |
| Secondary category | Lifestyle |

## Store Listing

**App description** (paste as-is):

```
Crush is where conversation comes first.

Meet verified people, join their Friends List, and talk in private chats or
live group rooms. No endless swiping — just real conversation with people who
actually reply.

WHAT YOU CAN DO
• Private 1-to-1 chats with photos, videos, emoji and reactions
• Live group rooms hosted by verified members — text and emoji only
• Stories that disappear in 24 hours
• Friends Lists — join the people you want to talk to most
• Send gifts and coins to say thanks
• Real-time online status, typing indicators and unread counts
• Chat themes so your conversations look the way you like

VERIFIED, 18+ ONLY
Every account passes ID and age verification within 7 days of signing up, or
it's locked. We're an adults-only community and we keep it that way.

SAFETY BUILT IN
• Report and block anyone, from any chat or profile
• A moderation team reviews every report within 24 hours
• Full blocked list you control from your profile
• Delete your account and your data at any time, right in the app

MEMBERSHIPS
Crush Gold and Crush Diamond VIP unlock unlimited chats, all group rooms and
priority visibility. New members get a free trial period to try the app first.

Crush is a general-audience adult social app. Sexually explicit content is not
allowed and is removed.

Terms: https://rizzlachat.com/legal/terms
Privacy: https://rizzlachat.com/legal/privacy
Support: rizzchatsupport@gmail.com
```

**Keywords (100 chars)**

```
chat,social,meet people,friends,rooms,messaging,talk,new friends,群chat,live chat,creators
```
Use this safe 97-char version:
```
chat,social,meet people,make friends,rooms,messaging,talk,live chat,creators,community,dating
```

**Promotional text (170)**

```
New: 24-hour Stories, group rooms with live hosts, and chat themes. Join a Friends List and start talking today.
```

| Field | Value |
| --- | --- |
| Support URL | https://rizzlachat.com/legal/contact |
| Marketing URL | https://rizzlachat.com |
| Privacy Policy URL | https://rizzlachat.com/legal/privacy |
| EULA | Standard Apple EULA (in-app terms also at /legal/terms) |

## Visual Assets

| Asset | Spec | Source |
| --- | --- | --- |
| App icon | 1024×1024 PNG, no alpha, square corners | `public/icon-512.png` upscaled / re-exported from the Crush logo, flattened on `#0B0B12` |
| iPhone 6.9" screenshots | 1320×2868 (or 1290×2796), 3–10 shots | Capture: Home/Discover, Chat thread, Group room, Stories, Profile, Memberships |
| iPhone 6.5" (optional fallback) | 1284×2778 | same order |
| iPad 13" (only if universal) | 2064×2752 | same order |
| App preview video | optional, 15–30 s, skip for v1 | — |

Screenshot order to use: 1) Discover 2) 1-to-1 chat 3) Group room 4) Stories
5) Profile & verification 6) Membership plans.

## Build & Technical

| Field | Value |
| --- | --- |
| Build | Signed `.ipa` from `.github/workflows/mobile-build.yml` (job **ios**), uploaded via Transporter |
| Version number | `1.0.0` |
| Build number | `1` (increment every upload) |
| Export compliance | **Yes**, uses encryption → **only standard/exempt encryption (HTTPS/TLS)** → qualifies for exemption. `ITSAppUsesNonExemptEncryption = NO` in Info.plist |
| Content rights | **Yes**, contains third-party content (user-generated); we have rights/permission and run a moderation program |
| Age rating | **18+** (see below) |

**Age rating questionnaire answers**

| Question | Answer |
| --- | --- |
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content or Nudity | **Infrequent/Mild** (suggestive themes only; explicit content prohibited & moderated) |
| Profanity or Crude Humor | Infrequent/Mild |
| Alcohol, Tobacco, or Drug Use | None |
| Mature/Suggestive Themes | **Frequent/Intense** |
| Horror/Fear, Gambling, Contests | None |
| Unrestricted Web Access | No |
| User-Generated Content | **Yes** — with moderation, reporting, blocking, and a published content policy |
| Age Assurance / Made for Kids | Not for kids; **18+ gate with ID verification** |
| Final rating | **18+** |

**App Privacy ("Nutrition Label")** — data collected and linked to identity:

| Data type | Collected | Linked | Tracking | Purpose |
| --- | --- | --- | --- | --- |
| Email address | Yes | Yes | No | App functionality, account |
| Phone number | Yes (optional signup) | Yes | No | Account, authentication |
| Name / Username | Yes | Yes | No | App functionality |
| Photos or Videos | Yes | Yes | No | App functionality (profile, chat, Stories) |
| Other User Content (messages) | Yes | Yes | No | App functionality |
| Sensitive Info (government ID, selfie, DOB) | Yes | Yes | No | App functionality — legal 18+ age verification |
| Purchase History | Yes | Yes | No | App functionality |
| Device ID / Push token | Yes | Yes | No | App functionality (notifications) |
| Product Interaction / Crash / Performance | Yes | Yes | No | Analytics, app functionality |
| Precise Location | **No** | — | — | — |
| Contacts, Browsing History, Health, Financial card data | **No** (card data handled by Stripe, never stored by us) | — | — | — |

Tracking across apps/websites: **No**. No third-party ad SDKs.

## Pricing

| Field | Value |
| --- | --- |
| Price | **Free** (app itself) |
| In-app purchases in iOS build | **None** — purchase entry points are hidden on iOS (`useIosBillingRestricted()`), so no StoreKit products are required for v1 |
| Availability | All countries/regions **except** where adult social apps are restricted: exclude China mainland, Saudi Arabia, UAE, Qatar, Kuwait, Iran, Iraq, Pakistan, Indonesia, Malaysia, Turkey, Egypt, Nigeria (optional — safest default is a US/CA/UK/EU/AU/NZ launch) |

> If Apple asks how members pay: existing plans and balances purchased on the
> web work in the app; the iOS build sells nothing and shows no external
> purchase links or CTAs.

## Review Info

| Field | Value |
| --- | --- |
| Demo account required | Yes |
| Username | `appreview@rizzlachat.com` |
| Password | `Crush!Review2026#Ax7` |
| Status | Live now — email confirmed, ID/age verification approved, Crush Diamond VIP, 5,000 coins |
| Contact first/last name | Waleed Ahmad (or the account holder) |
| Phone | *(developer/owner phone)* |
| Email | rizzchatsupport@gmail.com |

**Notes for App Review** (paste):

```
Crush is an 18+ social chat app. Sign in with the demo account provided — it is
already age-verified and funded, so you can open chats, join group rooms and
view Stories without hitting the verification wall.

• Age gate: every user must complete 18+ ID verification within 7 days or the
  account is locked. See /verify.
• UGC safety: every chat and profile has a Report/Block menu. Reports are
  reviewed within 24 hours by our moderation team (queue at /admin/reports).
  Blocked users are listed and manageable in Profile.
• Account deletion: Profile → "Delete my account" removes the account and data
  in-app, per guideline 5.1.1(v). Public instructions:
  https://rizzlachat.com/legal/delete-account
• Payments: this iOS build sells nothing. All membership/coin purchase entry
  points are hidden on iOS; there are no external purchase links or CTAs.
• Explicit sexual content is prohibited by our Acceptable Use policy
  (/legal/acceptable-use) and removed by automated + human moderation.
• Native functionality: camera capture, push notifications, haptics, safe-area
  layout and hardware-key handling.
```

---

# 2. Google Play (Play Console)

## App Details

| Field | Value |
| --- | --- |
| App name (30) | `Crush: Chat & Meet New People` |
| Short description (80) | `Verified 18+ chat app. Private chats, live rooms, Stories and real people.` (74) |
| Full description (4,000) | Use the same description as Apple above |
| Category | Social |
| Tags | Chat, Messaging, Social networking, Communities, Dating |
| Contact email | rizzchatsupport@gmail.com |
| Contact phone | *(optional — owner's number)* |
| Website | https://rizzlachat.com |
| Privacy Policy URL | https://rizzlachat.com/legal/privacy |
| Account deletion URL | https://rizzlachat.com/legal/delete-account |

## Visual Assets

| Asset | Spec | Source |
| --- | --- | --- |
| App icon | 512×512 PNG, 32-bit, no transparency | `public/icon-512.png` flattened on `#0B0B12` |
| Feature graphic | 1024×500 PNG/JPG | Crush logo centred on the Ocean Rose gradient + tagline "Find your crush" |
| Phone screenshots | min 2 (use 6–8), 1080×1920 or 1080×2400 | Discover, Chat, Room, Stories, Profile, Plans |
| 7"/10" tablet screenshots | only if tablet support is declared | same order |
| Promo video | optional YouTube link | skip for v1 |

## Build & Technical

| Field | Value |
| --- | --- |
| Bundle | Signed `.aab` from `.github/workflows/mobile-build.yml` (job **android**) |
| Application ID | `com.kolotechnology.crush` |
| versionName | `1.0.0` |
| versionCode | `1` (increment every upload) |
| Target API level | **API 35 (Android 15)** — Play's current minimum for new apps |
| Min SDK | 23 (Capacitor default) |
| Permissions used | INTERNET, CAMERA, READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, POST_NOTIFICATIONS (remove anything else) |
| Ads declaration | **No** — the app contains no ads |
| Target audience / age | **18 and over only** (do not tick any child age band); not "Designed for Families" |

**Content rating questionnaire (IARC)** — answer set:

| Question | Answer |
| --- | --- |
| App category | Social Networking / Communication |
| Violence, blood, gore | No |
| Sexuality — explicit content | **No** (prohibited & moderated) |
| Sexuality — suggestive/mature themes | **Yes** |
| Profanity | Yes, mild/user-generated |
| Controlled substances, gambling | No |
| Users can interact / share content | **Yes** |
| Users can share their location | No |
| Personal info shared with third parties | No (service providers only) |
| Digital purchases | **Yes** |
| Expected rating | **Mature 17+ / PEGI 18** |

**Data safety form** — data collected:

| Data | Collected | Shared | Encrypted in transit | Deletable | Purpose |
| --- | --- | --- | --- | --- | --- |
| Name, username | Yes | No | Yes | Yes | App functionality, account |
| Email address | Yes | No | Yes | Yes | Account, account management |
| Phone number | Yes (optional) | No | Yes | Yes | Account, authentication |
| Government ID + selfie, date of birth | Yes | No | Yes | Yes | **Age verification / fraud prevention** |
| Photos and videos | Yes | No | Yes | Yes | App functionality |
| Messages (in-app) | Yes | No | Yes | Yes | App functionality |
| Purchase history | Yes | No | Yes | Yes | App functionality |
| Device/push token | Yes | No | Yes | Yes | Notifications |
| App interactions, crash logs, diagnostics | Yes | No | Yes | Yes | Analytics, app performance |
| Location, contacts, financial card numbers | **Not collected** (card data goes directly to Stripe) | — | — | — | — |

Also declare: data is **encrypted in transit**, users **can request deletion**
in-app and at https://rizzlachat.com/legal/delete-account, and the app has an
**independent security review**: No.

**Play UGC / social declarations**
- App contains user-generated content: **Yes**
- Moderation: in-app report + block on every chat and profile, blocked list in
  Profile, human review queue with a 24-hour SLA, automated image moderation.
- Content policy URL: https://rizzlachat.com/legal/acceptable-use
- Moderation contact: rizzchatsupport@gmail.com

## Release

| Field | Value |
| --- | --- |
| Track order | Internal testing → Closed testing (12 testers, 14 days — required for new personal accounts) → Open testing → Production |
| Countries | Same list as Apple: launch US, CA, UK, EU, AU, NZ; exclude countries that restrict adult social apps |
| Pricing | **Free** app |
| In-app products | Android build keeps web checkout for person-to-person services. If Play classifies coins as digital goods, rebuild with `VITE_ANDROID_BILLING_RESTRICTED=true` to hide all purchase CTAs (no code change needed) |
| App access | Provide the same reviewer login as Apple, with KYC pre-approved and coins loaded — otherwise review hits the verification wall |

---

# 3. Reviewer demo account — ready to use

| Field | Value |
| --- | --- |
| Email | `appreview@rizzlachat.com` |
| Password | `Crush!Review2026#Ax7` |
| Display name | App Review |
| Membership | Crush Diamond VIP (all rooms + unlimited chats) |
| Coins | 5,000 |
| Age / ID verification | Approved (no verification wall) |
| Works on | https://rizzlachat.com, the iOS shell, the Android shell, and Play internal testing |

Use the same credentials in App Store Connect → App Review Information and in
Play Console → App access. Rotate the password after launch from Profile →
Settings if it is ever shared outside the review teams.

# 4. Build the binaries

Add the 8 signing secrets in GitHub → Settings → Secrets and variables →
Actions, then run **Actions → Mobile builds → Run workflow**. Artifacts
`crush-android-aab` and `crush-ios-ipa` appear on the run page.
The list is also in-app at **Admin → Secret Manager** (`/admin/secrets`).
