# Website Content Auditor

**One-line description:** A content strategist and conversion copywriter audits a website's messaging, clarity, tone, CTA effectiveness, and content gaps — then delivers rewritten headlines and a content improvement roadmap.

**Execution Pattern:** Phase Pipeline

**Domain:** developer

---

## Inputs

- `website_url` (string, required): The URL to audit.
- `business_description` (string, required): What the business does, who it serves, and what makes it different.
- `primary_goal` (string, required): The #1 action you want visitors to take (e.g., "book a demo", "start a free trial", "buy").
- `target_audience` (string, required): Who the ideal customer is — their role, pain points, and what they're comparing you against.
- `current_tagline_or_headline` (string, optional): Your existing homepage headline if you want direct feedback on it.
- `competitors` (array of strings, optional): 2–3 competitor names or URLs for positioning comparison.
- `brand_voice` (string, optional): Adjectives that describe your brand voice (e.g., "direct, technical, no-fluff" or "warm, accessible, encouraging").

---

## Phases

### Phase 1 — Value Proposition Clarity
- Does the headline communicate what you do, for whom, and why it matters — in one sentence?
- Is the subheadline adding meaning or just restating the headline?
- Would a stranger landing on this page for the first time know what to do within 5 seconds?
- Is the value proposition differentiated from competitors, or generic ("faster, smarter, easier")?

Deliverable: Rewritten headline + subheadline options (3 variations, with rationale for each).

### Phase 2 — CTA Audit
For every call-to-action on the site:
- Is the CTA specific ("Start free trial") or vague ("Learn more", "Click here")?
- Does it communicate value, not just action? ("Get my free audit" vs "Submit")
- Is there one primary CTA per page, or are users given too many choices?
- Are CTAs placed at the right moments in the user journey (after enough context)?
- What is the friction cost of each CTA? (email only vs full form vs phone call required)

Deliverable: Rewritten CTAs for top 3 pages.

### Phase 3 — Copy Tone & Readability
- Reading level: Is the copy appropriate for the target audience? (Hemingway score estimate)
- Sentence length: Are there walls of text? Are paragraphs scannable?
- Active vs passive voice: Is the copy energetic and direct, or bureaucratic?
- Jargon: Is industry jargon explained, or assumed?
- Personality: Does the copy sound like a real human or a corporate template?

Deliverable: Before/after rewrites for the most problematic section.

### Phase 4 — Trust & Social Proof
- Are there testimonials? Are they specific (results, numbers) or generic ("great product!")?
- Are logos and case studies present? Are they from recognizable or relevant companies?
- Are credentials, certifications, or awards shown where relevant?
- Is there a clear privacy/security message where users are asked to share data?
- Do the testimonials address the primary objections a prospect would have?

Deliverable: List of missing trust elements and how to source them.

### Phase 5 — Content Gaps
Based on the target audience and their likely questions at each stage of the buyer journey:

**Awareness stage:** What content is missing that would attract the right visitors?
**Consideration stage:** What questions do prospects have that aren't answered?
**Decision stage:** What objections aren't addressed before the CTA?
**Retention stage:** Is there content for existing customers to get more value?

Deliverable: Prioritized content gap list with recommended format (blog post, FAQ, comparison page, video, case study).

### Phase 6 — Content Improvement Roadmap

**Rewrites needed now (blocking conversions):**
Specific copy blocks, with rewritten versions.

**Additions needed this quarter:**
New pages or sections, with briefs.

**Structural changes:**
Pages that should be merged, split, or repurposed.

**What's working — don't touch:**
Content that is well-written and converting.
