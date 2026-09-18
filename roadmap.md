# Crush — Launch Roadmap

## Security (done 2026-09-04)
- [x] Server-side moderation gate (`requestModeratedUpload`) — avatars, profile media, chat media, stories
- [x] signAvatars profile-media gated by owner / has_chat_access
- [x] Runway mixes showcase shoot + bundled portraits with local fallback



## RevenueCat (brother's business project)
- [ ] BLOCKED: need a RevenueCat **v2 secret API key** (`sk_` created under API keys → v2). Stored key is legacy → API v2 returns 403.
- [ ] Create products: crush_gold_weekly, crush_diamond_weekly, crush_coins_500, crush_coins_1500, crush_coins_5000, crush_coins_15000
- [ ] Create consumable coin packs in App Store Connect and Google Play, import them into RevenueCat, and attach them to the Current Default offering.
- [ ] Create entitlements: `gold`, `diamond`; attach subscription products
- [ ] Create/verify "Default" offering marked **Current**, with packages for all products
- [ ] Connect App Store app (bundle com.kolotechnology.crush) + Play app
- [ ] Configure webhook: https://rizzlachat.com/api/public/payments/revenuecat (handler verified 200/401)

## App Store Connect
- [ ] App Review contact phone (required, currently red)
- [ ] Age rating questionnaire (18+)
- [ ] App Privacy answers
- [ ] Screenshots (6.7" + 6.5" + iPad if supported)
- [ ] Upload signed .ipa (Mac/Xcode or Transporter) then select build
- [ ] Reviewer credentials: review.apple@rizzlachat.com (Diamond, KYC approved)

## Google Play
- [ ] Create/verify a dedicated reviewer login and enter its email + password under Play Console → App content → App access → Test account
- [ ] Store listing, Data safety, 18+ content rating, privacy + deletion URLs
- [ ] Upload AAB → internal testing → production

## Store reviews (done 2026-09-18)
- [x] Native App Store and Google Play review request after five successful chat sends.
- [x] Branded pre-prompt, 30-day dismissal cooldown, one-time completion guard, and no web/conversation interruption.

## Creator identity (done)
- [x] Creator Identity Manager: one creator per photo, deterministic (runway + showcase reel), seeded from the root loader so SSR/hydration agree.
- [x] Every creator image is a link to the matching profile (runway rail + grid, showcase tiles, swipe card tap, crush-home phone mock).
- [x] ImageGuard swaps an expired creator photo for her bundled portrait (never the logo / never black).
- [x] Ops: "Identity Manager" added to /admin/ops (audits map + storage signing).

## Creator profile polish
- [ ] Make creator profile hero + cards feel premium/animated/inviting (not basic)

## Stories (done 2026-09-11)
- [x] Full-width Instagram-style story rail with every available creator profile, touch scrolling, snap points, and desktop navigation.
- [x] Reliable story navigation through touch swipes, mouse dragging, wheel scrolling, and always-visible arrow controls.
- [x] Real active stories lead the rail; full creator directory follows without duplicate profiles.
