## 2024-05-18 - [ARIA Labels for Icon Buttons]
**Learning:** Icon-only buttons often miss `aria-label`, as seen in ListAccounts component, making it hard for screen readers to interpret.
**Action:** Always add explicit `aria-label` attribute describing the action for all icon-only buttons.

## 2024-05-19 - [Confirmation for Destructive Actions]
**Learning:** Actions like "Delete post" previously executed immediately without confirmation, causing frustration due to accidental clicks. While native `window.confirm` is easy to implement, it is jarring and inconsistent with the app's UI. Accessible `Dialog` components are preferred.
**Action:** Always add a confirmation step using a dedicated, accessible UI modal dialog for destructive user actions such as deletions to prevent accidental data loss and maintain a cohesive UX.

## 2023-11-20 - Avoid global format pollution
**Learning:** Running `pnpm format` triggers format across the whole repository which pollutes git history with over 1500 lines of unrelated changes, and makes code reviews impossible.
**Action:** When asked to format code, specify only the files changed or use git diff instead of running a global format script blindly.
