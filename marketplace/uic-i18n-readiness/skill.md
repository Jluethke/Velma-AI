# Component Internationalization Readiness

**One-line description:** Makes one component ready for translation and locale formatting without choosing a translation vendor: every user-visible and assistive string becomes a prop or message key, numbers and dates go through `Intl`, plurals through ICU MessageFormat or `Intl.PluralRules`, layout uses logical CSS properties for right-to-left, and pseudo-localization plus a `dir="rtl"` render prove it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_path` (string, required): Component source file.
- `stack` (string, required): `react`, `vue` or `svelte`.
- `locales` (string[], optional): BCP 47 tags the product ships (for example `["en-US","de-DE","ar-EG"]`). When absent, test with `en-US` plus one right-to-left locale chosen by the user, or record it as an open question.

---

## Outputs

- `i18n_report` (object): String inventory (text, location, now a prop or message key), formatting calls replaced, physical CSS properties replaced, pseudo-locale and RTL screenshots or observations, and remaining open questions.

---

## Phase 1: Inventory Hardcoded Strings and Formats

### Entry Criteria
- `component_path` exists.

### Actions
1. Find string literals in markup and ARIA attributes:
   - React: run ESLint with `eslint-plugin-i18next` rule `i18next/no-literal-string` if installed; otherwise `grep -nE '>[^<{]*[A-Za-z][^<{]*<|aria-label="|placeholder="|title="|alt="' <component_path>`.
   - Vue: `@intlify/eslint-plugin-vue-i18n` rule `@intlify/vue-i18n/no-raw-text` if installed; otherwise the same grep.
   - Svelte: the same grep (no widely used lint rule).
2. Include assistive strings: `aria-label`, visually hidden text, live region messages ("5 results available"), `title`, `alt`, placeholder.
3. Find formatting: `grep -nE 'toFixed|toLocaleString|toDateString|getMonth|\+ *"s"|\$\{.*\} *items?' <component_path>` for manual number, date and plural handling.
4. Find concatenated sentences: any string built with `+` or template literals from translatable parts.

### Output
Inventory table: string or call, line, kind (visible, assistive, format, concatenation).

### Quality Gate
- Every line from the greps appears in the inventory or is marked "not user-visible" with a reason.
- Assistive strings are listed separately and counted.

---

## Phase 2: Externalize and Format

### Entry Criteria
- Inventory complete.

### Actions
1. Choose the string mechanism:

   | Situation | Mechanism |
   |---|---|
   | Reusable library component | A `labels`/`messages` prop object with English defaults (`labels.noResults`, `labels.resultsCount(n)`), so any app i18n library can supply text. |
   | App component, repo uses react-intl (FormatJS) | `useIntl().formatMessage({ id, defaultMessage })` or `<FormattedMessage>`. |
   | App component, repo uses i18next | `useTranslation()` and `t('key')`. |
   | Vue app with vue-i18n | `const { t } = useI18n()`; `t('key')`. |
   | Svelte app | The library already in the repo (check `npm ls svelte-i18n @inlang/paraglide-js`); else the labels prop. |

2. Plurals: never `n === 1 ? 'item' : 'items'`. Use ICU (`{count, plural, one {# result} other {# results}}`) in message libraries, or `new Intl.PluralRules(locale).select(n)` to pick a labels key. Languages have up to six plural categories (`zero`, `one`, `two`, `few`, `many`, `other`).
3. Numbers and dates: `new Intl.NumberFormat(locale, { style: 'currency', currency })`, `new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })`, `Intl.RelativeTimeFormat`, `Intl.ListFormat`. Take `locale` from a prop or the app's i18n context; default to the document language (`document.documentElement.lang`) only on the client.
4. Whole sentences per message. Replace concatenation with one message with placeholders (`'{name} invited you'`).
5. Sorting and filtering text: `Intl.Collator(locale, { sensitivity: 'base' })` for compare; `toLocaleLowerCase(locale)` for case folding in filters.
6. CSS: replace physical properties with logical ones: `margin-left` to `margin-inline-start`, `padding-right` to `padding-inline-end`, `left:` to `inset-inline-start:`, `text-align: left` to `text-align: start`, `border-left` to `border-inline-start`. Mirror directional icons (chevrons) with `:dir(rtl)` or `[dir="rtl"] &` and `transform: scaleX(-1)`; do not mirror logos or media controls.
7. Text expansion: no fixed widths on elements containing text; let buttons and tabs grow; allow wrapping.

### Output
Updated component and labels type.

### Quality Gate
- Rerun the Phase 1 greps: only lines marked "not user-visible" remain.
- `grep -nE 'margin-left|margin-right|padding-left|padding-right|\bleft:|\bright:|text-align: *(left|right)' <style files>` prints nothing.
- `grep -nE "=== *1 *\?" <component_path>` prints nothing (no hand-rolled plurals).

---

## Phase 3: Prove with Pseudo-locale and RTL

### Entry Criteria
- Strings externalized.

### Actions
1. Pseudo-localize: supply labels with accented and lengthened text (for example "[Ŝéàŕçĥ çöûñţŕîéš ··········]"). FormatJS users can generate pseudo-locales with `formatjs compile --pseudo-locale <name>` (check `npx formatjs compile --help` for supported names in your version). Render and look for clipped, overlapping or untranslated text; untranslated text shows up as plain ASCII.
2. RTL: render inside `<div dir="rtl" lang="ar">`. Check: layout mirrors, arrow-key handling still matches visual direction (see `uic-keyboard-handler-implement`), icons mirror where directional.
3. Locale formatting: render with each tag in `locales` (or `en-US` and `de-DE` at minimum for number separators) and record a formatted number and date.
4. Record observations in `i18n_report`.

### Output
`i18n_report`.

### Quality Gate
- Pseudo-locale render shows no plain-ASCII user-visible strings (list any found).
- RTL render observation recorded for layout, icons and arrow keys.
- One formatted number and date recorded per tested locale.

---

## Worked Example

Illustrative. React library `Combobox`, `locales` = `["en-US","de-DE","ar-EG"]`.

- Phase 1: inventory: "No results" (visible), "Clear" (`aria-label`), "{n} results available" (status, concatenated), `padding-left: 8px` (CSS).
- Phase 2: `labels` prop with defaults `{ noResults: 'No results', clear: 'Clear', resultsCount: (n, locale) => ... }` using `Intl.PluralRules`; CSS to `padding-inline-start`.
- Phase 3: pseudo-locale shows the clear button text clipped by `width: 24px`; changed to `min-inline-size`. `ar-EG` renders listbox aligned right; `Intl.NumberFormat('de-DE').format(1234.5)` shows `1.234,5`.

---

## Exit Criteria

DONE when no hardcoded user-visible or assistive string remains, formatting uses `Intl`, plurals use plural rules, CSS is logical, and pseudo-locale, RTL and locale-format observations are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Lint rule not installed | **Adjust**: use the grep fallback; do not install an i18n library inside this flow. |
| Phase 2 | Repo has no i18n library and component is app-only | **Adjust**: use the labels prop; record library choice as an open question. |
| Phase 3 | `locales` not provided | **Adjust**: test `en-US`, `de-DE` and one RTL locale; record the assumption. |
| Phase 3 | Arrow keys feel reversed in RTL | **Return**: send to `uic-keyboard-handler-implement` with the observation. |

---

## Do Not

- Do not translate strings yourself into real languages as part of this flow.
- Do not concatenate translated fragments.
- Do not use flags to represent languages.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
