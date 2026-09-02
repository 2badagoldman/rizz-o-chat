# Crush — Launch Roadmap

## RevenueCat (brother's business project)
- [ ] BLOCKED: need a RevenueCat **v2 secret API key** (`sk_` created under API keys → v2). Stored key is legacy → API v2 returns 403.
- [ ] Create products: crush_gold_weekly, crush_diamond_weekly, crush_coins_500, crush_coins_1500, crush_coins_5000, crush_coins_15000
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
