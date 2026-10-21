# Headings, Landmarks and Page Structure Audit

**One-line description:** Dumps the heading outline, landmark regions, page title and language of every inventory page, and checks them against SC 1.3.1 Info and Relationships, 2.4.1 Bypass Blocks, 2.4.2 Page Titled, 2.4.6 Headings and Labels, 3.1.1 Language of Page and 3.1.2 Language of Parts, including title and focus updates on single-page-app route changes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`.

---

## Outputs

- `structure_issues` (object[]): One row per failure: `issue_id` (S001, ...), `sc`, `page_id`, `selector`, `check` (name from the tables below), `expected`, `actual`, `best_practice_only` (true when the item is advice, not a WCAG failure), `source` = "structure".

---

## Phase 1: Dump Headings, Landmarks, Title and Language

### Entry Criteria
- Inventory exists.

### Actions
1. On each page run in the DevTools Console:
   ```js
   const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')]
     .filter(h => h.offsetParent !== null || getComputedStyle(h).position === 'fixed')
     .map(h => `${'  '.repeat((+(h.getAttribute('aria-level') || h.tagName[1] || 2)) - 1)}${h.getAttribute('aria-level') ? 'aria-level ' + h.getAttribute('aria-level') : h.tagName} ${h.textContent.trim().slice(0, 70)}`);
   console.log(hs.join('\n'));
   console.table([...document.querySelectorAll('header,nav,main,aside,footer,section[aria-label],section[aria-labelledby],form[aria-label],[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo],[role=region],[role=search]')]
     .map(l => ({ tag: l.tagName, role: l.getAttribute('role'), label: l.getAttribute('aria-label') || (l.getAttribute('aria-labelledby') && document.getElementById(l.getAttribute('aria-labelledby'))?.textContent.trim()) || '' })));
   console.log('title:', document.title, '| lang:', document.documentElement.lang);
   ```
2. Note: `<header>` and `<footer>` are banner and contentinfo landmarks only when they are not inside `article`, `aside`, `main`, `nav` or `section`. `<section>` is a region landmark only when it has an accessible name. Check the browser's own view in DevTools, Elements, Accessibility pane, "Enable full-page accessibility tree".
3. Save the output per page.

### Output
Outline, landmark table, title and lang per page.

### Quality Gate
- Every page has a saved dump with all four parts (headings, landmarks, title, lang).

---

## Phase 2: Apply Structure Checks

### Entry Criteria
- Dumps exist.

### Actions
1. Apply each check. Note which are WCAG failures and which are best practice only:

   | Check | SC | Fail when | WCAG failure? |
   |---|---|---|---|
   | visual-heading-not-marked | 1.3.1 | text that looks like a heading (larger, bold, starts a section) is a `div` or `p` | yes |
   | fake-heading | 1.3.1 | an `h1` to `h6` is used only for styling text that is not a heading | yes |
   | heading-describes | 2.4.6 | heading text does not describe its section ("Section 1", "More") | yes |
   | skipped-level | none | levels jump (h2 to h4) | no: best practice; record with `best_practice_only` = true |
   | one-h1 | none | zero or several `h1` | no: best practice, unless the page has no heading at all for its main title (then visual-heading-not-marked) |
   | bypass | 2.4.1 | no skip link and no `main` landmark and no headings to jump by | yes |
   | main-landmark | 1.3.1 | main content is outside `main`, or more than one visible `main` | record as best practice unless content structure is lost |
   | duplicate-landmark-label | 1.3.1 | two or more `nav` (or `aside`, `region`) with no labels or the same label | best practice; record |
   | content-outside-landmarks | none | visible content outside all landmarks (axe `region`) | best practice |
   | page-title | 2.4.2 | `document.title` empty, generic ("React App", "Home" on every page), or the same on different pages | yes |
   | lang-present | 3.1.1 | `<html>` has no `lang`, or a value that is not a valid BCP 47 tag (`en`, `en-US`, `fr`) | yes |
   | lang-of-parts | 3.1.2 | a passage in another language has no `lang` on its container (proper names and technical terms are exempt) | yes |
   | data-table-headers | 1.3.1 | a data table has no `<th>` (or has `<th>` without `scope` when headers are ambiguous) | yes |
   | lists-marked | 1.3.1 | a visual list is built from `div` or `br` | yes |

2. Compare titles across all pages: `title` values must be unique per distinct page purpose. Collect every page title into one list and look for repeats.

### Output
Draft `structure_issues`.

### Quality Gate
- Every row has `best_practice_only` set to true or false according to the table.
- The page title list for all pages was compared and every repeat is either a row or justified (same page purpose).

---

## Phase 3: Single-Page-App Route Changes

### Entry Criteria
- The site is a client-side routed app (React, Vue or Angular with a router: the URL changes without a full page load, visible as no document request in DevTools, Network, filter "Doc"). Otherwise skip this phase and note "not applicable".

### Actions
1. Navigate between three pages using in-app links (not by typing URLs). After each navigation run `document.title` and `document.activeElement` in the Console.
2. Fail when `document.title` stays the same after the route changes (2.4.2).
3. Record (best practice, also supports 2.4.3) when `document.activeElement` remains the clicked link in the old view or becomes `BODY` with no announcement: screen reader users get no signal that the page changed. Expected: focus moves to the new `h1` (with `tabindex="-1"`) or the main region, or a polite live region announces the new title.
4. Router hooks to name in the fix hint: React Router (set `document.title` in a route component effect or use the framework's metadata API; Next.js `metadata` export), Vue Router (`router.afterEach`), Angular Router (route `title` property with `TitleStrategy`).

### Output
`structure_issues`.

### Quality Gate
- Three route changes are recorded with before and after `document.title` and `document.activeElement` values.

---

## Worked Example

Illustrative only. P03 `/cart`.

Phase 1 output:
```
H1 Your cart
    H3 Items
    H3 Order summary
title: Shop | lang:
```
Landmarks: `HEADER`, `NAV` (no label), `NAV` (no label), `DIV#content` (no main), `FOOTER`.
Phase 2 rows: S001 `lang-present` 3.1.1 (empty lang); S002 `page-title` 2.4.2 ("Shop" on every page); S003 `skipped-level` h1 to h3, `best_practice_only` true; S004 `duplicate-landmark-label`, `best_practice_only` true. No `bypass` row: there is no `main`, but headings exist to jump by, so 2.4.1 passes.
Phase 3: clicking "Checkout" changes the URL; `document.title` stays "Shop". Row S005 2.4.2.

---

## Exit Criteria

DONE when every page has a structure dump, every check has a recorded result, and SPA route changes were tested or marked not applicable.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Headings are inside shadow DOM web components | **Adjust**: use the DevTools full-page accessibility tree, which includes shadow content, instead of the query. |
| Phase 2 | Unsure whether text "looks like a heading" | **Adjust**: if it introduces a group of content below it and is styled differently from body text, treat it as a heading. |
| Phase 3 | Title updates only after data loads | **Adjust**: wait for the main content to render, then read `document.title`; record the delay if the title is wrong while content is shown. |

**Do not:** record skipped heading levels as a WCAG failure; add `role="main"` to several elements; fix headings by changing their visual size only.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
