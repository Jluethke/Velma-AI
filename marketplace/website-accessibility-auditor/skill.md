# Website Accessibility Auditor

**One-line description:** An accessibility specialist audits a website against WCAG 2.2 AA, identifies barriers for users with disabilities, and delivers a prioritized remediation plan with code-level fixes.

**Execution Pattern:** Phase Pipeline

**Domain:** developer

---

## Inputs

- `website_url` (string, required): The URL to audit.
- `target_wcag_level` (string, optional): "A", "AA", or "AAA". Defaults to "AA" (legal minimum in most jurisdictions).
- `known_user_base` (string, optional): Any known user demographics or disability considerations.
- `tech_stack` (string, optional): Framework if known — affects code fix recommendations.
- `existing_a11y_issues` (string, optional): Any issues already known or previously reported.

---

## Phases

### Phase 1 — Perceivable
WCAG Principle 1 — Can all users perceive the content?

- **Images:** Do all meaningful images have descriptive alt text? Are decorative images marked `alt=""`?
- **Color contrast:** Do all text/background combinations meet 4.5:1 (normal text) or 3:1 (large text)?
- **Color alone:** Is color used as the only means of conveying information (e.g., red = error)?
- **Captions & transcripts:** Do videos have captions? Audio have transcripts?
- **Responsive text:** Does text resize to 200% without horizontal scrolling or content loss?

### Phase 2 — Operable
WCAG Principle 2 — Can all users operate the interface?

- **Keyboard navigation:** Can every interactive element be reached and activated with keyboard only?
- **Focus visibility:** Is the focus indicator clearly visible (not hidden with outline:none)?
- **Focus order:** Does the tab order follow a logical reading sequence?
- **Skip links:** Is there a "skip to main content" link at the top?
- **Touch targets:** Are all touch targets at least 44×44px (WCAG 2.2 AA)?
- **Timing:** Are there time limits? Can they be extended or disabled?
- **Flashing content:** Is there any content that flashes more than 3 times per second?

### Phase 3 — Understandable
WCAG Principle 3 — Can all users understand the content and interface?

- **Language:** Is `<html lang="...">` set correctly?
- **Error identification:** Are form errors described in text, not just color?
- **Labels:** Do all form inputs have associated `<label>` elements (not placeholder-only)?
- **Autocomplete:** Do personal data fields use correct `autocomplete` attributes?
- **Consistent navigation:** Does navigation appear in the same location across pages?
- **Predictable focus:** Does focus not unexpectedly move or trigger navigation?

### Phase 4 — Robust
WCAG Principle 4 — Is the content robust enough for assistive technologies?

- **Semantic HTML:** Are headings (H1–H6) used for structure, not styling?
- **ARIA usage:** Is ARIA used correctly? Are there ARIA attributes without matching roles?
- **Interactive components:** Do custom components (dropdowns, modals, tabs) have correct ARIA roles, states, and properties?
- **Status messages:** Are dynamic status updates announced via `aria-live` regions?
- **Valid HTML:** Are there duplicate IDs, unclosed tags, or invalid nesting?

### Phase 5 — Legal & Compliance Risk
- Applicable laws: ADA (US), AODA (Canada), EAA (EU), Equality Act (UK)
- Current compliance level estimate: Compliant / At Risk / Non-compliant
- Highest-risk issues that could generate complaints or litigation
- Recommended next step: internal audit, third-party audit, or formal VPAT

### Phase 6 — Remediation Plan

**Blockers (prevent access entirely — fix immediately):**
Issue, affected users, WCAG criterion, specific code fix.

**High (significantly impair experience):**
Same format.

**Medium (reduce usability for some users):**
Same format.

**Quick wins (< 2 hours each, high compliance value):**
Specific code changes, copy changes, or config toggles.
