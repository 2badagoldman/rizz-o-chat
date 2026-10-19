# RevenueCat configuration result

Target project: `0582993e`.

## Outcome: blocked

`REVENUECAT_SECRET_API_KEY` is present, but RevenueCat rejected it because it does not belong to the requested project. No products, offerings, or packages were created or changed. Existing products and packages could not be verified; nothing is assumed to already exist.

Update `REVENUECAT_SECRET_API_KEY` in Project Settings → Secrets with a RevenueCat v2 secret API key belonging to the Crush project `0582993e`, with permission to read/create products and read/update offerings and packages. Then rerun configuration.

Alternatively, in that project's RevenueCat dashboard, confirm these consumable products exist for each connected store and attach them to separate packages in the current Default offering:

| Store product identifier | Display name |
| --- | --- |
| crush_coins_500 | 500 Crush Coins |
| crush_coins_1500 | 1,500 Crush Coins |
| crush_coins_5000 | 5,000 Crush Coins |
| crush_coins_15000 | 15,000 Crush Coins |

RevenueCat product setup does not create the underlying App Store Connect or Google Play products. Those must exist in their respective stores. Preserve existing subscription packages, prices, and entitlements.

## API response log

### GET https://api.revenuecat.com/v2/projects/0582993e/products

Status: **403**

```json
{"doc_url":"https://errors.rev.cat/authorization-error","message":"The API key does not belong to the project 0582993e.","object":"error","retryable":false,"type":"authorization_error"}
```

### GET https://api.revenuecat.com/v2/projects/0582993e/offerings

Status: **403**

```json
{"doc_url":"https://errors.rev.cat/authorization-error","message":"The API key does not belong to the project 0582993e.","object":"error","retryable":false,"type":"authorization_error"}
```

POST requests were not attempted: authorization failed, so existing products/packages cannot be identified safely.