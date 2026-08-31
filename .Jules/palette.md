## 2024-05-18 - Improved Empty States with Guidance
**Learning:** Replaced plain text empty states across timeline and notification views with robust empty states that utilize icons and actionable guidance (e.g., "Follow some users or check out the federated timeline to see more content").
**Action:** When designing or refactoring UI views that deal with potentially empty collections (arrays), always look out for plain text empty states and upgrade them with visual polish (icons, borders) and actionable guidance to improve the user experience.

## 2024-06-03 - Replaced Text Loading States
**Learning:** Replaced raw text "Loading..." indicators with visual spinners (`Loader2` from `lucide-react`) + `.sr-only` text. It is crucial to preserve the screen-reader only text when replacing text with icons to ensure assistive technologies still announce the loading state.
**Action:** When adding visual loading indicators, always pair them with an `.sr-only` text span so that both sighted and screen-reader users receive equivalent feedback.