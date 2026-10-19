<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- RevenueCat purchase/restore sync authenticates the member and independently reads the server API; client entitlement lists never authorize grants.
- RevenueCat event webhooks remain the only writer of new store subscription rows and coin grants; snapshot sync updates tiers/existing rows only to avoid duplicate purchase credits.
- RevenueCat diagnostics reuse the protected admin-role check and mount the native billing hook only after authorization, keeping SDK work out of non-admin views.
