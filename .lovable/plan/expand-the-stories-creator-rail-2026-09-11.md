# Expand the Stories creator rail

## What will change
- Remove the 60-profile limit so the rail uses the full available creator directory.
- Keep real, currently active creator stories ahead of generated/demo story entries.
- Deduplicate creators so each person appears once even when they exist in both sources.
- Preserve the current swipe, drag, wheel, arrow, posting, viewing, and reply behavior.

## Validation
- Verify on a mobile viewport that the rail contains more than 60 creator profiles.
- Swipe to later profiles and open a story near the end of the rail.
- Confirm no duplicate creator IDs and no broken profile images.

## Technical details
- Update the story-group builder to stop truncating the creator list.
- Keep the existing real-story server query and merge order unchanged, with database stories first.
