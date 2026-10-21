# Component Styling Approach Decision

**One-line description:** Picks the styling technique for one component (CSS Modules, plain CSS with custom properties, Tailwind, zero-runtime CSS-in-TS, runtime CSS-in-JS, Vue scoped or module styles, Svelte scoped styles) from what the repo already uses and where the component ships, then fixes the rules for state styling through ARIA attributes, theming tokens, forced-colors and reduced motion.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path of the repository root.
- `stack` (string, required): `react`, `vue` or `svelte`.
- `component_contract` (object, required): Contract from `uic-props-state-events-contract`; used for the state list that styles must reflect.

---

## Outputs

- `styling_decision` (object): The chosen technique with the evidence line that justified it, the file names to create, the token source, the ARIA-attribute selector list, and the forced-colors and reduced-motion rules.

---

## Phase 1: Detect What the Repo Already Uses

### Entry Criteria
- `repo_dir` contains a `package.json`.

### Actions
1. Run from `repo_dir`:
   - `npm ls tailwindcss styled-components @emotion/react @vanilla-extract/css sass --depth=0`
   - `git ls-files | grep -E '\.module\.(css|scss)$' | head`
   - `git ls-files | grep -E 'tailwind\.config\.(js|cjs|mjs|ts)$'`
   - `grep -rln '@import "tailwindcss"' --include=*.css . | head` (Tailwind v4 uses a CSS import instead of a config file)
2. Record each hit with its count. The most-used existing technique is the default answer.
3. Determine where the component ships:
   - App-internal (lives in the app that renders it).
   - Published library (has its own `package.json` with `"name"` and a build step, or lives in a `packages/` folder consumed by others).
4. For React, determine whether consumers use React Server Components: `grep -rn '"use client"' --include=*.tsx . | head` and check for `next` with an `app/` directory.

### Output
Evidence list and ship target.

### Quality Gate
- Each command's output (or "no match") is recorded verbatim in `styling_decision`.
- Ship target is one of the two values.

---

## Phase 2: Decide

### Entry Criteria
- Evidence list exists.

### Actions
1. Apply the first matching row:

   | Condition | Decision |
   |---|---|
   | `stack` == `vue` | `<style scoped>` in the SFC, or `<style module>` if the repo already uses `$style`. |
   | `stack` == `svelte` | Component `<style>` block (scoped by default); `:global(...)` only for styling a child component's root through a class prop. |
   | React, repo already uses one technique for components | Same technique. Consistency beats preference. |
   | React, published library, consumers use Server Components | CSS Modules or plain CSS file plus CSS custom properties, or vanilla-extract. Not styled-components or Emotion (runtime CSS-in-JS needs client components). |
   | React, published library, consumers unknown | CSS Modules or plain CSS with custom properties; ship the CSS file and document the import. |
   | React app with Tailwind already configured | Tailwind utility classes; variants via a class map object, not string concatenation spread across JSX. |
   | React, nothing exists yet | CSS Modules (`<Name>.module.css`): no extra dependency in Vite or Next.js. |

2. Tailwind in a published library: record the consumer requirement that their Tailwind content scanning (v3 `content` globs, v4 `@source`) must include the library's dist files, or the classes are purged. If the consumer cannot do that, do not use Tailwind for the library.
3. Theming: expose design tokens as CSS custom properties on `:root` or the component root (`--uic-combobox-border: ...`). Read existing tokens with `grep -rn -- '--[a-z]' src/styles | head`; reuse them before inventing names.

### Output
Technique, file names, token source.

### Quality Gate
- The decision cites the row number and the evidence line from Phase 1.
- File names follow the repo pattern seen in `git ls-files`.

---

## Phase 3: Fix the State and Accessibility Style Rules

### Entry Criteria
- Technique chosen.

### Actions
1. Style state through the ARIA attributes the component already sets, so visuals cannot drift from semantics: `[aria-selected="true"]`, `[aria-expanded="true"]`, `[aria-disabled="true"]`, `[aria-invalid="true"]`, `[aria-current]`. List every attribute from the contract's state table that has a visual. Do not add parallel `.is-selected` classes.
2. Focus: style `:focus-visible`, never remove `outline` without a replacement of at least the same visibility. WCAG 2.2 SC 2.4.7 (Focus Visible) is Level AA.
3. Forced colors (Windows contrast themes): add `@media (forced-colors: active)` rules for any state shown only by background color or box-shadow; use system colors such as `Highlight`, `HighlightText`, `CanvasText`, `ButtonText`. Box shadows are removed in forced-colors mode, so focus rings built from `box-shadow` need an `outline` fallback.
4. Motion: wrap transitions and animations in `@media (prefers-reduced-motion: no-preference)` or disable them under `(prefers-reduced-motion: reduce)`.
5. Direction: use logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`) so right-to-left works without a second stylesheet.
6. Write all rules into `styling_decision`.

### Output
`styling_decision`.

### Quality Gate
- Every stateful visual in the contract maps to one ARIA attribute selector.
- The rule list contains a `:focus-visible` rule, a `forced-colors` block and a `prefers-reduced-motion` block.
- `grep -nE 'margin-left|margin-right|padding-left|padding-right|left:|right:' <planned css>` returns nothing once the CSS is written (checked again by `uic-i18n-readiness`).

---

## Worked Example

Illustrative. `repo_dir` = `/work/shop-ui`, `stack` = `react`.

- Phase 1: `npm ls` prints `tailwindcss@4.x`; `git ls-files | grep module.css` prints nothing; repo is an app.
- Phase 2: row "React app with Tailwind already configured" applies. Variant map: `const tone = { neutral: 'bg-white text-gray-900', danger: 'bg-red-50 text-red-900' } as const;`
- Phase 3: selectors `aria-selected:bg-blue-50` (Tailwind ARIA variant) for options, `focus-visible:outline-2` for the input, a `forced-colors:` variant on the active option.

---

## Exit Criteria

DONE when the technique is chosen by a cited table row and evidence line, and the ARIA-selector, focus, forced-colors, reduced-motion and logical-property rules are written.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repo mixes several techniques with similar counts | **Adjust**: use the technique of the most recently added component (`git log --diff-filter=A --name-only -- src/components | head`). |
| Phase 2 | Library consumers use Server Components but repo uses styled-components | **Stop**: raise it as an open question; do not migrate styling in this flow. |
| Phase 3 | Design spec shows state only through color | **Adjust**: add a non-color cue (border, icon, underline) and note it; WCAG 2.2 SC 1.4.1 Use of Color. |

---

## Do Not

- Do not add a new styling dependency when the repo already has one.
- Do not use `!important` to win specificity fights; fix the selector.
- Do not hardcode colors that already exist as tokens.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
