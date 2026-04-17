## LV Demo2 Update Log

Date: `2026-04-16`
Branch: `lv-demo2`

### Summary

This update mainly improves community sidebar behavior, profile page cleanup, adoption image handling, and health page auto-context loading.

### Main Changes

1. Community recommendations
- Replaced static "Cats to Follow" content with backend-driven suggestions.
- Added recommendation reasons such as mutual connections or recent activity.
- Expanded the suggestion list and made it scrollable.

2. Stories section
- Changed stories from a single-source display into a mixed layout:
  followed users first, suggested users after that.
- Reworked the UI to separate the two groups with a vertical divider instead of badge text under each avatar.

3. Trending panel
- Reworked the right-panel trending list to improve ranking display and scrolling behavior.
- Removed extra helper text / navigation controls that were visually noisy.

4. Profile page cleanup
- Removed the static "Similar Cats" module from the right side of the profile page.

5. Adoption page image fix
- Fixed broken image rendering for cats whose `photo_url` uses a `data:` base64 image URL.
- `resolveCatImg()` now supports `http`, `https`, `data`, `blob`, and relative asset paths.

6. Health page improvements
- Removed the need for manually entering `userId` before saving records.
- Health page now auto-detects the current logged-in user.
- Health page now auto-loads the current cat from local context or by matching the logged-in owner.
- Added cache-busting version parameters to `health.js` and `config.js` in `health.html` to avoid stale browser script cache.

### Files Touched

- `backend/src/controllers/users.controller.js`
- `frontend/js/community.js`
- `frontend/js/health.js`
- `frontend/pages/account.html`
- `frontend/pages/adoption.html`
- `frontend/pages/cat-facebook.html`
- `frontend/pages/cat-profile.html`
- `frontend/pages/health.html`
- `frontend/pages/index.html`
- `backend/data/notification-read-state.json`
- `backend/package-lock.json`

### Notes

- `backend/data/notification-read-state.json` contains runtime/local state style changes.
- `backend/package-lock.json` is included with the user's request to commit remaining changes as well.
