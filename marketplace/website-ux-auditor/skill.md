# Website UX Auditor

**One-line description:** A senior UX designer audits a website for usability failures, friction points, information architecture problems, and visual hierarchy issues — then delivers prioritized fixes with rationale.

**Execution Pattern:** Phase Pipeline

**Domain:** developer

---

## Inputs

- `website_url` (string, required): The website URL being audited.
- `website_description` (string, required): What the website does, its primary goal, and its target audience.
- `key_user_flows` (array of strings, optional): The top 3–5 journeys users are expected to complete (e.g., "sign up", "purchase", "find pricing"). Defaults to inferring from description.
- `device_priority` (string, optional): "desktop", "mobile", or "both". Defaults to "both".
- `screenshots_or_notes` (string, optional): Any screenshots, Loom links, or notes about specific problem areas the requester has already noticed.

---

## Phases

### Phase 1 — First Impressions (0–5 seconds)
Audit what a new visitor sees and understands immediately:
- What is the value proposition? Is it clear in under 5 seconds?
- Is the primary CTA obvious? Is there only one?
- Does the visual hierarchy guide the eye to the right place?
- Does the above-the-fold content earn scroll?

### Phase 2 — Information Architecture
Audit how content is organized and navigable:
- Navigation structure: Is it intuitive? Too many items? Too few?
- Labeling: Are section names and link labels user-vocabulary, not internal vocabulary?
- Findability: Can a first-time user locate pricing, contact, or key features without guessing?
- Breadcrumbs and wayfinding: Does the user always know where they are?

### Phase 3 — User Flow Friction
For each key user flow provided (or inferred):
- Map the actual steps required to complete the flow
- Identify every click, form field, decision, or load that adds friction
- Flag where users most likely drop off and why
- Note any flows that require more steps than necessary

### Phase 4 — Visual Design & Consistency
- Typography: Is there a clear hierarchy (H1/H2/body/caption)? Readable at all sizes?
- Color: Contrast ratios, color-coded meaning consistency, accessibility overlap
- Spacing and density: Is there enough whitespace? Is content too compressed?
- Component consistency: Do buttons, cards, and forms look and behave the same across pages?

### Phase 5 — Micro-interactions & Feedback
- Do interactive elements (buttons, links, forms) give clear feedback on hover/click/submit?
- Are loading states handled? Empty states?
- Error messages: Are they helpful, specific, and placed near the problem?
- Form UX: Labels, placeholders, validation, required fields — are they clear and forgiving?

### Phase 6 — UX Recommendations Report
Deliver a structured report:

**Critical (fix immediately — blocking user goals):**
List each issue, the user flow it breaks, and the specific fix.

**High (fix in next sprint — significant friction):**
Same format.

**Medium (improve in next quarter — polish):**
Same format.

**Quick wins (< 1 day each — high impact, low effort):**
Specific, actionable changes any developer can implement without a designer.

**What's working well:**
Call out 3–5 things that should NOT be changed.
