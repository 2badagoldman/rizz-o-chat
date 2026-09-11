# Add App Store and Google Play review prompts

## What will change
- Add the native Apple and Google in-app review capability to the mobile app.
- Ask only after a positive engagement milestone, such as several successful chat sends.
- Show a branded, dismissible pre-prompt before opening the official store review sheet.
- Remember dismissals and completed prompts to avoid repeatedly interrupting users.
- Keep the prompt disabled in the ordinary website, previews, signed-out sessions, and conversations themselves.

## Validation
- Verify the prompt UI and dismiss flow in a safe browser QA mode.
- Confirm the native review request is called only on iOS or Android.
- Confirm cooldown and one-time review rules persist between sessions.

## Technical details
- Use the Capacitor-compatible native in-app review plugin.
- Centralize eligibility and milestone tracking in a shared review manager.
- Emit the engagement milestone from successful creator-chat sends and mount one global prompt in the app shell.
