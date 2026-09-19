# Crush — Launch Roadmap

## Security (done 2026-09-04)
- [x] Server-side moderation gate (`requestModeratedUpload`) — avatars, profile media, chat media, stories
- [x] signAvatars profile-media gated by owner / has_chat_access
- [x] Runway mixes showcase shoot + bundled portraits with local fallback



## RevenueCat (brother's business project)
- [x] Default offering has rizzla_weekly (Gold) + rizzla_monthly (Diamond) attached for iOS + Android + Web. Confirmed via dashboard 2026-09-19.
- [x] Webhook configured: REVENUECAT_WEBHOOK_SECRET in secrets store; handler at https://rizzlachat.com/api/public/payments/revenuecat verified 200/401.
- [x] Code maps store product IDs → internal price IDs (rizzla_weekly→rizz_gold_weekly, rizzla_monthly→rizz_diamond_weekly) and handles Android base-plan suffix (`rizzla_weekly:weekly`).
- [ ] NOTE: stored REVENUECAT_SECRET_API_KEY is legacy v1 — v2 API calls return 403. Not blocking: UI confirms products attached. Only needed for programmatic coin-pack creation.
- [ ] Create consumable coin packs (crush_coins_500/1500/5000/15000) in App Store Connect + Google Play, import into RevenueCat, attach to Default offering.
- [ ] Verify entitlements `gold`, `diamond` exist and are attached to the subscription products.
- [ ] Connect App Store app (bundle com.kolotechnology.crush) + Play app to RevenueCat.

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
