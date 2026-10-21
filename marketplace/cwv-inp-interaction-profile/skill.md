# INP Interaction Profiling

**One-line description:** Reproduces the slowest field interaction from RUM attribution in the Chrome DevTools Performance panel under CPU throttling, splits it into input delay, processing duration and presentation delay, and names the main-thread work (long tasks, event handlers, style and layout, third-party scripts) behind the dominant phase.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_urls` (string[], required): URLs where INP fails.
- `diagnosis_plan` (object, required): From `cwv-field-lab-reconcile`. This flow runs only for INP entries.
- `rum_p75_report` (object[], required): From `cwv-rum-p75-analysis`; holds INP phase p75s and `top_offenders` targets.

---

## Outputs

- `inp_interaction_profile` (object[]): Per reproduced interaction: target selector, interaction type, page load state, total duration, input delay, processing duration, presentation delay, the top functions by self time with source file and line, forced layout events, and third-party script time.
- `inp_bottleneck` (string): One of `input_delay`, `processing_duration`, `presentation_delay`.

---

## Phase 1: Pick the Interaction to Reproduce

### Entry Criteria
- `diagnosis_plan` has an INP entry. Otherwise **Return** with empty outputs.

### Actions
1. From `rum_p75_report` / its `top_offenders`, take the INP group's top `interactionTarget` and its `interactionType` (pointer, keyboard) and `loadState` (`loading`, `dom-interactive`, `dom-content-loaded`, `complete`).
2. If RUM is unavailable, list candidate interactions by hand: the main buttons, menus, filters, form inputs and accordions on the page.
3. Note the load state: an interaction with `loadState` = `loading` or `dom-interactive` happened during page load, when hydration and script evaluation compete. Reproduce it at the same moment (click during load), not after the page is idle.

### Output
Target, type and load state to reproduce.

### Quality Gate
- The chosen target is copied from RUM data, or the output states RUM was unavailable.

---

## Phase 2: Record the Interaction

### Entry Criteria
- Target chosen. Production build or deployed site (never a dev server: development builds run extra checks and are slower).

### Actions
1. Chrome, Incognito, extensions off. DevTools Performance panel. Set CPU throttling to 4x slowdown (Lighthouse's default mobile CPU multiplier) or, if the panel offers a calibrated low-tier mobile preset, use that and record which.
2. Check the live metrics view on the panel landing page: it shows local INP and an interaction log as you click. Click the target and read the INP value and its phases there first.
3. Click Record, perform the interaction once (for load-time interactions, start recording with "Record and reload" and click as soon as the target appears), then stop.
4. In the trace, open the Interactions track. Hover the interaction: the tooltip shows input delay, processing duration and presentation delay. Copy them.
5. In the Main track under the interaction, click the longest task (tasks over 50 ms are long tasks per the Long Tasks API and show a red corner). Open Bottom-Up, group by URL or by Activity, sort by Self Time. Copy the top five rows with source file and line (click a row to jump to Sources).
6. Look for purple "Layout" or "Recalculate Style" blocks inside a script task with a "Forced reflow" warning; record the function that triggered them.

### Output
Phase values and main-thread breakdown.

### Quality Gate
- The three phase values are copied from the Interactions track tooltip and sum to the interaction duration within rounding.
- At least the top five Bottom-Up rows are recorded with file and line.

---

## Phase 3: Name the Bottleneck

### Entry Criteria
- Phase 2 data exists.

### Actions
1. Prefer field phase p75s from RUM; use the lab trace when field phases are missing. Pick the largest phase.
2. Interpret:
   | `inp_bottleneck` | What causes it | Next flow |
   |---|---|---|
   | `input_delay` | Other tasks were running when the user acted: script evaluation, hydration, timers, third-party tags | `cwv-inp-yield-long-tasks` (break up and defer the competing work), plus `cwv-code-split-*` if script evaluation during load dominates |
   | `processing_duration` | The event handlers themselves are slow: heavy logic, synchronous state updates, large re-renders | `cwv-inp-yield-long-tasks`; for React, also `cwv-inp-react-render-cost` |
   | `presentation_delay` | Rendering after handlers: large DOM updates, style recalculation, layout, paint | `cwv-inp-react-render-cost` (React) or reduce DOM size and use `content-visibility: auto` for off-screen sections |
3. If the Bottom-Up top row is a third-party URL, record it. The fix is to load, delay or remove that script, not to edit vendor code.

### Output
`inp_interaction_profile`, `inp_bottleneck`.

### Quality Gate
- `inp_bottleneck` names the largest phase from the stated source.
- Each profile row names a file and line or a third-party URL, not a vague description.

---

## Worked Example

Illustrative only. RUM top offender: `button#add-to-cart`, pointer, `loadState` = `complete`; field phase p75s: inputDelay 14, processingDuration 262, presentationDelay 48.

Phase 2 at 4x slowdown: tooltip "Input delay 9 ms, Processing duration 296 ms, Presentation delay 61 ms" (366 ms). Bottom-Up self time:
```text
recalcTotals      cart-4f1a.js:412   118 ms
formatCurrency    cart-4f1a.js:88     64 ms
Layout            (forced, from recalcTotals)  51 ms
dispatch          vendor-react.js     38 ms
(anonymous)       gtm.js              29 ms
```
Phase 3: `inp_bottleneck` = `processing_duration`; next `cwv-inp-yield-long-tasks` and `cwv-inp-react-render-cost`.

---

## Exit Criteria

DONE when the field's worst interaction is reproduced at the right load state, its three phases and top main-thread functions are recorded from the trace, and a bottleneck phase with its next flow is named.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No INP entry in the plan | **Return**: emit empty outputs. |
| Phase 2 | Interaction is fast in the lab | **Adjust**: raise CPU throttling, reproduce during load if RUM says `loading`, and test with real logged-in state and data volume. |
| Phase 2 | Function names are minified | **Adjust**: enable production source maps for the trace session, or map by file and line. |
| Phase 3 | Field and lab bottlenecks disagree | **Adjust**: use field; record the lab result as secondary. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
