## 2024-05-18 - [ARIA Labels for Icon Buttons]
**Learning:** Icon-only buttons often miss `aria-label`, as seen in ListAccounts component, making it hard for screen readers to interpret.
**Action:** Always add explicit `aria-label` attribute describing the action for all icon-only buttons.
