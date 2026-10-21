# Accessibility Scope and Inventory

**One-line description:** Builds the page inventory and component inventory that every later WCAG 2.2 AA test runs against, using the W3C WCAG-EM sampling method (structured sample plus random sample plus complete processes), so no test is run on an ad hoc set of pages.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `site_url` (string, required): Base URL of the running site or app under test, for example `https://staging.example.com`. Must be reachable from the machine running the tests.
- `repo_dir` (string, required): Absolute path to the front-end source repository.
- `stack` (string, required): One of `react`, `vue`, `angular`, `html` (server-rendered templates such as Django, Jinja, Rails ERB, Blade, or static HTML).
- `scope_notes` (string, optional): Anything the owner excludes or adds, for example "admin area out of scope" or "include the PDF invoice download page".

---

## Outputs

- `page_inventory` (object[]): One row per page state to test: `id` (P01, P02, ...), `url`, `template` (layout or route component name), `state` (default, logged-in, error, empty, modal-open, and so on), `sample_type` (structured, random, process), `process` (name of the complete process it belongs to, or null), `setup_steps` (exact clicks or form fills needed to reach the state).
- `component_inventory` (object[]): One row per reusable interactive component: `id` (C01, ...), `name`, `source_file` (path relative to `repo_dir`), `aria_pattern` (the WAI-ARIA Authoring Practices pattern name it should follow, or "native"), `used_on` (list of page ids).

---

## Phase 1: Collect Every Reachable Page Template

### Entry Criteria
- `site_url` responds with HTTP 200: `curl -s -o /dev/null -w "%{http_code}" <site_url>` prints `200`.
- `repo_dir` exists and contains a `package.json` (react, vue, angular) or a templates directory (html).

### Actions
1. List routes from source, by `stack`:

   | `stack` | Command | What to read |
   |---|---|---|
   | react (React Router) | `rg -n "path:\s*['\"]|<Route\s" <repo_dir>/src` | every `path` value |
   | react (Next.js app router) | `find <repo_dir>/app -name "page.tsx" -o -name "page.jsx" -o -name "page.js"` | each folder path is a route |
   | react (Next.js pages router) | `find <repo_dir>/pages -name "*.tsx" -o -name "*.jsx" -o -name "*.js"` | each file path is a route, skip `_app` and `_document` |
   | vue (Vue Router) | `rg -n "path:\s*['\"]" <repo_dir>/src/router` | every `path` value |
   | vue (Nuxt) | `find <repo_dir>/pages -name "*.vue"` | each file path is a route |
   | angular | `rg -n "path:\s*['\"]" <repo_dir>/src/app --glob "*routes*.ts" --glob "*routing*.ts"` | every `path` value |
   | html | `rg -n "path\(|url\(|get '|Route::get" <repo_dir>` and `ls` the templates folder | URL patterns and template files |

2. If the site publishes a sitemap, fetch it: `curl -s <site_url>/sitemap.xml`. Add every distinct URL pattern not already found.
3. Group routes into templates: two URLs that render the same layout and route component are one template (for example `/products/12` and `/products/98`).
4. Read `scope_notes` and remove excluded areas; add any requested page.

### Output
A deduplicated list of templates with one example URL each.

### Quality Gate
- Every route string found by the command in step 1 maps to exactly one template row (count the `rg` matches and the template rows that cite them).
- Each template row has a concrete example URL that returns HTTP 200 or a documented login requirement.

---

## Phase 2: Select the WCAG-EM Sample

### Entry Criteria
- Template list exists.

### Actions
1. Structured sample: include one URL for every template, plus these pages if they exist: home, login, sign-up, search results, contact or help page, the accessibility statement, any page with a form, any page with media (video or audio), any page with a data table, any page with a chart.
2. Complete processes (WCAG 2.2 conformance requirement 3 says a page that is part of a process conforms only if every page in the process conforms): list each multi-step task (checkout, sign-up, password reset, booking) and add every step of it as a row with `sample_type` = `process`.
3. Random sample: WCAG-EM asks for a random sample in addition to the structured sample. Ask the owner for the random sample size. If the owner gives none, record "random sample size" as an open question in `scope_notes` handling and take every URL from the sitemap that is not yet listed, up to the number the owner approves. Do not pick a number yourself.
4. Add page states. For every page that has them, add a separate row for: form submitted with errors, modal or dialog open, menu or disclosure expanded, empty state, logged-in state, loading state if visible for long enough to be inspected.
5. For each row write `setup_steps` precisely, for example "Go to /checkout, click 'Continue' with all fields empty".

### Output
The draft `page_inventory`.

### Quality Gate
- Every template from Phase 1 appears in at least one row with `sample_type` = `structured`.
- Every step of every listed process appears as its own row.
- Every row whose `state` is not `default` has non-empty `setup_steps`.

---

## Phase 3: Build the Component Inventory

### Entry Criteria
- Draft `page_inventory` exists.

### Actions
1. List shared components by `stack`:
   - react: `rg -l "export (default )?function [A-Z]|export const [A-Z]\w* =" <repo_dir>/src/components`
   - vue: `find <repo_dir>/src/components -name "*.vue"`
   - angular: `rg -l "@Component\(" <repo_dir>/src/app`
   - html: `find <repo_dir>/templates -path "*partials*" -o -path "*includes*" -o -path "*components*"`
2. Keep only interactive or structural ones: buttons, links styled as buttons, form fields, selects, comboboxes, date pickers, dialogs and modals, menus, tabs, accordions, carousels, tooltips, toasts, data tables, pagination, headers, footers, navigation.
3. For each, set `aria_pattern` from the WAI-ARIA Authoring Practices Guide (governance engine) pattern list at `https://www.w3.org/WAI/ARIA/governance engine/patterns/`: Accordion, Alert, Alert and Message Dialogs, Breadcrumb, Button, Carousel, Checkbox, Combobox, Dialog (Modal), Disclosure, Feed, Grid, Link, Listbox, Menu and Menubar, Menu Button, Meter, Radio Group, Slider, Slider (Multi-Thumb), Spinbutton, Switch, Table, Tabs, Toolbar, Tooltip, Tree View, Treegrid, Window Splitter. If the component is a plain native element (`<button>`, `<a href>`, `<input>`, `<select>`), set "native".
4. Fill `used_on` by searching page templates for the component name: `rg -l "<ComponentName" <repo_dir>/src` and mapping files to page rows.
5. Emit `page_inventory` and `component_inventory` as JSON files in the project, for example `<repo_dir>/a11y/page_inventory.json` and `<repo_dir>/a11y/component_inventory.json`.

### Output
`page_inventory`, `component_inventory`.

### Quality Gate
- `python -m json.tool <repo_dir>/a11y/page_inventory.json` and the same for `component_inventory.json` exit 0.
- Every component row has a `source_file` that exists: `test -f <repo_dir>/<source_file>` succeeds for each.
- Every component row has an `aria_pattern` value from the governance engine list above or "native".

---

## Worked Example

Illustrative only. Input: `site_url` = `https://staging.shop.example`, `stack` = `react` (Next.js app router), `scope_notes` = "admin out of scope".

Phase 1:
```
$ find app -name "page.tsx"
app/page.tsx
app/products/[id]/page.tsx
app/cart/page.tsx
app/checkout/shipping/page.tsx
app/checkout/payment/page.tsx
app/checkout/confirm/page.tsx
app/admin/page.tsx
```
Six templates kept, `/admin` removed per `scope_notes`.

Phase 2 produces rows such as:
```json
{"id":"P05","url":"/checkout/shipping","template":"checkout/shipping","state":"error",
 "sample_type":"process","process":"checkout",
 "setup_steps":"Add any product to cart, go to /checkout/shipping, click Continue with all fields empty"}
```

Phase 3 produces rows such as:
```json
{"id":"C03","name":"QuantityStepper","source_file":"src/components/QuantityStepper.tsx",
 "aria_pattern":"Spinbutton","used_on":["P02","P03"]}
```

---

## Exit Criteria

DONE when `page_inventory` covers every template, every step of every complete process, and every listed page state, and `component_inventory` lists every shared interactive component with an existing source file and an governance engine pattern.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `site_url` does not return 200 | **Stop**: ask the owner for a reachable URL or VPN access; scans against an error page are worthless. |
| Phase 1 | Routes are generated at runtime and `rg` finds none | **Adjust**: crawl the running site with the browser and the sitemap, and record that the inventory came from crawling. |
| Phase 2 | Owner gives no random sample size | **Return**: record it as an open question and continue with the structured and process sample only. |
| Phase 2 | A page needs a login the tester does not have | **Stop**: request a test account; do not skip logged-in pages silently. |
| Phase 3 | Component has no clear governance engine pattern | **Adjust**: set "custom" and describe the expected keyboard behavior in plain words in the row. |

**Do not:** invent routes that are not in source or sitemap; test only the home page; skip error and modal states (they hold most form and focus failures).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
