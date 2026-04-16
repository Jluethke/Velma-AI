# Website Performance Auditor

**One-line description:** A performance engineer audits a website for Core Web Vitals failures, render-blocking resources, image bloat, caching gaps, and JavaScript overhead — then delivers a ranked fix list with expected impact.

**Execution Pattern:** Phase Pipeline

**Domain:** developer

---

## Inputs

- `website_url` (string, required): The URL to audit.
- `tech_stack` (string, optional): Framework, CDN, hosting provider if known (e.g., "Next.js on Vercel", "WordPress on shared hosting").
- `lighthouse_scores` (object, optional): Existing Lighthouse scores `{performance, accessibility, seo, best_practices}` if already run.
- `target_audience_geography` (string, optional): Primary regions (affects CDN and latency recommendations).
- `business_context` (string, optional): Any known performance issues or customer complaints.

---

## Phases

### Phase 1 — Core Web Vitals Assessment
Evaluate the three CWV metrics and their impact on ranking + UX:
- **LCP (Largest Contentful Paint):** What is the LCP element? Is it render-blocked? What is the expected score?
- **INP (Interaction to Next Paint):** Are there long tasks blocking the main thread?
- **CLS (Cumulative Layout Shift):** Are images/ads/embeds causing layout shifts? Are dimensions specified?

For each metric: current likely state → target → primary fix.

### Phase 2 — Asset Audit
- Images: Format (WebP/AVIF?), compression, lazy loading, responsive srcset, LCP image preload
- JavaScript: Bundle size, unused JS, third-party scripts, render-blocking scripts
- CSS: Critical CSS inlined? Unused CSS? Render-blocking stylesheets?
- Fonts: Self-hosted vs CDN, font-display:swap, subsetting, preload hints

### Phase 3 — Network & Caching
- HTTP/2 or HTTP/3?
- CDN coverage: Is static content served from edge?
- Cache-Control headers: Are assets cached correctly? Cache busting strategy?
- Compression: gzip/Brotli enabled? On all text resources?
- DNS prefetch/preconnect for critical third parties?

### Phase 4 — Server-Side & Infrastructure
- TTFB (Time to First Byte): Server response time, database query performance, edge rendering
- Serverless cold starts: Are they impacting perceived load?
- Static vs dynamic: Are pages that could be static being rendered dynamically?
- API response times: Are any client-side API calls on the critical path?

### Phase 5 — Third-Party Impact
List every third-party script (analytics, chat, ads, tracking, social):
- Estimated load impact of each
- Whether it is render-blocking
- Recommendation: remove, defer, async, self-host, or replace with lighter alternative

### Phase 6 — Performance Fix Plan
Ranked by impact-to-effort ratio:

**Immediate (1 day, high impact):**
Specific implementation instructions for each fix.

**Sprint (1–2 weeks):**
Same.

**Quarterly (architecture changes):**
Same.

**Expected outcome:** Estimated Lighthouse performance score improvement and CWV pass/fail change after implementing Immediate + Sprint fixes.
