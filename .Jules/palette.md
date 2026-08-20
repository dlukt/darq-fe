## 2024-05-18 - [ARIA Labels for Icon Buttons]
**Learning:** Icon-only buttons often miss `aria-label`, as seen in ListAccounts component, making it hard for screen readers to interpret.
**Action:** Always add explicit `aria-label` attribute describing the action for all icon-only buttons.

## 2024-05-19 - [Confirmation for Destructive Actions]
**Learning:** Actions like "Delete post" previously executed immediately without confirmation, causing frustration due to accidental clicks. While native `window.confirm` is easy to implement, it is jarring and inconsistent with the app's UI. Accessible `Dialog` components are preferred.
**Action:** Always add a confirmation step using a dedicated, accessible UI modal dialog for destructive user actions such as deletions to prevent accidental data loss and maintain a cohesive UX.

## 2024-07-22 - Replacing native browser dialogs with accessible components
**Learning:** The native `window.confirm()` or `confirm()` dialog stops JS execution and can be inaccessible to screen readers, while also jarring the user out of the application experience. The UI library's dialog provides a much smoother, integrated, and accessible experience for destructive actions like account deletion.
**Action:** When working on administrative or settings features that include destructive actions, always check if they are using native dialogs. If so, plan to upgrade them to accessible modal components from the design system.
## 2024-03-24 - Interactive Component Accessibility
**Learning:** Found that entire custom UI cards acting as clickable wrappers (like `StatusCard.tsx` wrapping navigation logic via `onClick`) are completely invisible to keyboard users traversing timelines.
**Action:** Always ensure interactive container components have a `role` (e.g. `article` or `button`), a `tabIndex={0}`, an `onKeyDown` handler listening to `Enter` and `Space`, and `focus-visible` styles (`focus-visible:ring-2`, etc.). Furthermore, the `onKeyDown` handler must check `e.target` and `closest` interactive children (like links or buttons) to stop propagation and prevent triggering the wrapper action unexpectedly.
## 2024-03-24 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Icon-only buttons (like those using `variant="ghost" size="icon"`) must have `aria-label` and `title` attributes. Without them, screen readers will announce them as just "button" or read the SVG path, which is confusing for users. The tooltip (`title`) also helps mouse users understand the action.
**Action:** Always ensure that icon-only buttons include descriptive `aria-label` and `title` attributes.
## 2024-05-18 - Missing Aria Labels on Placeholder-Only Inputs
**Learning:** Found inputs in `ListsPage` and `ListAccounts` that relied entirely on placeholders, breaking screen reader accessibility.
**Action:** Always provide explicit `aria-label` attributes for text inputs (like `Input` or `Textarea`) that lack visually associated `<label>` elements.
