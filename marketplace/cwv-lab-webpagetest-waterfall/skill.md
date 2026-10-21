# WebPageTest Waterfall Reading

**One-line description:** Runs a WebPageTest test on a named real-device location and connection profile, then reads the waterfall, connection view and filmstrip to find late-discovered LCP resources, render-blocking requests, long connection setup, and redirect chains that Lighthouse simulation can hide.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): URLs to test.
- `wpt_api_key` (string, optional): WebPageTest API key. When empty, run the test through the web UI at webpagetest.org instead of the CLI; this flow is skipped in the master chain when no key is given.
- `form_factor` (string, optional): `mobile` or `desktop`; selects the location and device profile.

---

## Outputs

- `wpt_findings` (object[]): Per URL: test id and result URL, median run number, TTFB, start render, LCP time, the LCP request row number and its request start time, render-blocking request rows, connection setup times per origin, and redirect hops.

---

## Phase 1: Run the Test

### Entry Criteria
- Either `wpt_api_key` is set, or the user can run the test in the web UI.

### Actions
1. Install the CLI wrapper and read its options before using any flag: `npx webpagetest --help` and `npx webpagetest test --help`. Use only flags printed there.
2. List locations: `npx webpagetest locations --key "$WPT_KEY"`. Pick a location close to the users in the CrUX/RUM data, with a Chrome browser. Location strings take the form `<location>:<browser>.<connectivity>`, for example `Dulles:Chrome.4G`; confirm the exact string from the listing.
3. Choose the profile:
   | `form_factor` | Location choice | Connectivity |
   |---|---|---|
   | `mobile` | A mobile device or a Chrome location with mobile emulation | A 4G profile from the listing |
   | `desktop` | A desktop Chrome location | Cable profile from the listing |
4. Run 3 tests per URL, first view, with video so the filmstrip exists. In the CLI, the options for run count, first-view-only, video and location are printed by `test --help`; set them from there. In the UI: Advanced Configuration, "Number of Tests to Run" = 3, check "Capture Video", Repeat View = "First View Only".
5. Save the test id and result URL.

### Output
A completed test per URL with 3 runs.

### Quality Gate
- The result page (or `npx webpagetest results <test id>`) reports status complete with 3 successful runs.

---

## Phase 2: Read the Waterfall

### Entry Criteria
- Test complete.

### Actions
1. Open the median run (the result summary marks it; the CLI JSON holds it under the median first-view object; list keys with `jq '.data.median.firstView | keys'` before reading any key).
2. In the waterfall, find the LCP marker line (labeled LCP) and the request that delivers the LCP image (match the URL from `lab_lcp_element` if available, or the largest image above the fold in the filmstrip at LCP time).
3. Read the LCP request row against this table:
   | Observation on the LCP request row | Finding |
   |---|---|
   | Request starts only after a JS file finishes | Image is injected by JavaScript; not in initial HTML |
   | Request starts after a CSS file finishes | Image is a CSS `background-image` |
   | Request starts late with low priority shown in the request details | Missing `fetchpriority="high"` or the image is lazy-loaded |
   | Long teal/orange/purple bars (DNS, connect, SSL) on the row | Image is on a separate origin needing a new connection |
   | Request starts early but the download bar is long | Bytes too large for the connection |
4. Find render-blocking requests: rows with the render-blocking indicator icon (WebPageTest marks them), usually CSS and synchronous scripts in `<head>`. List them.
5. Open the Connection View and record DNS, connect and TLS time per origin. Several third-party origins each paying connection setup before start render is a finding.
6. Note redirects: rows with 301/302 status before the HTML document.

### Output
Waterfall findings table per URL.

### Quality Gate
- The LCP request is identified by row number and URL, with its request start time recorded.
- Each render-blocking request is listed by row number.

---

## Phase 3: Confirm with the Filmstrip

### Entry Criteria
- Waterfall findings recorded.

### Actions
1. Open the filmstrip view at 100 ms intervals.
2. Record the first frame with content (start render) and the frame where the LCP element appears complete.
3. If the LCP element appears painted well after its request finished, record "render delay" (script or CSS holding paint, or a fade-in animation).
4. If fonts swap visibly between frames, record "font swap" with the frame times.
5. Assemble `wpt_findings`.

### Output
`wpt_findings`.

### Quality Gate
- `wpt_findings` gives start render and LCP times copied from the result, and every finding cites a waterfall row or filmstrip frame time.

---

## Worked Example

Illustrative only. URL `https://shop.example.com/p/blue-mug`, mobile, location string chosen from the listing.

Phase 2: median run is run 2. The LCP image `gallery-1-1200.jpg` is row 23. Its request starts at 2.1 s, right after row 19 `/assets/gallery-8d1e.js` completes: image is injected by JavaScript. Rows 3 (`/assets/index-9c2e.css`) and 4 (`https://fonts.googleapis.com/css2?...`) carry the render-blocking icon. Connection view: `fonts.gstatic.com` pays DNS 80 ms + connect 90 ms + TLS 110 ms.

Phase 3: start render 1.6 s; LCP image visible complete at the 2.9 s frame; text flashes from fallback to web font between 1.7 s and 2.0 s.

---

## Exit Criteria

DONE when each URL has a 3-run test with the median run's LCP request row, render-blocking rows, connection setup times and filmstrip frame times recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unknown flag error from the CLI | **Adjust**: rerun `test --help` and use the printed flag; do not guess. |
| Phase 1 | Test queued for a long time | **Retry**: choose another location from the listing with the same browser and connectivity. |
| Phase 2 | LCP marker missing in waterfall | **Adjust**: read LCP from the result metrics and match by time; record that the marker was absent. |
| Phase 2 | Runs disagree on the LCP element | **Return**: report all three elements; the page has an unstable LCP candidate, which `cwv-lcp-subparts-breakdown` must handle. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
