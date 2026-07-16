## 2024-05-18 - [ARIA Labels for Icon Buttons]
**Learning:** Icon-only buttons often miss `aria-label`, as seen in ListAccounts component, making it hard for screen readers to interpret.
**Action:** Always add explicit `aria-label` attribute describing the action for all icon-only buttons.

## 2024-05-19 - [Confirmation for Destructive Actions]
**Learning:** Actions like "Delete post" previously executed immediately without confirmation, causing frustration due to accidental clicks. It's a key interaction pattern to ask before performing a destructive and irreversible action.
**Action:** Always add a confirmation step (e.g. `window.confirm` or a dedicated modal dialog) for destructive user actions such as deletions to prevent accidental data loss.
