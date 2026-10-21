# E2E Critical Journey Selection

**One-line description:** Picks the small set of user journeys that deserve browser end-to-end tests by scoring every candidate journey against a fixed risk table (money, access, irreversible data, compliance, traffic, incident history), and writes each chosen journey as a step-by-step spec with its data, dependencies and observable end state.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the application repository.
- `app_url` (string, required): Base URL of a running, non-production instance of the app (for example `http://localhost:3000` or a staging URL).
- `journey_sources` (object, optional): Extra evidence: analytics export of top pages or events, incident/postmortem list, support ticket tags, product owner's list of must-not-break flows. Missing keys are fine.

---

## Outputs

- `critical_journeys` (object[]): Ordered list. Each entry: `{id, title, risk_tags[], start_url, steps[], end_state_assertion, test_data_needed[], external_dependencies[], roles[], excluded_reason: null}` plus a separate list of rejected candidates with the lower layer (unit, API, component) that should cover them.

---

## Phase 1: Inventory Candidate Journeys

### Entry Criteria
- `repo_dir` exists and `app_url` answers: `curl -s -o /dev/null -w "%{http_code}" <app_url>` prints 200, 301, 302 or 401.

### Actions
1. List routes from the code, using the row that matches the repo:

| Framework signal | Command |
|---|---|
| Next.js `app/` dir | `find app -name "page.tsx" -o -name "page.jsx" -o -name "page.js"` |
| Next.js `pages/` dir | `find pages -name "*.tsx" -o -name "*.jsx" -o -name "*.js"` |
| React Router | `grep -rnE "path=\"|path: '" src` |
| Django | `python manage.py show_urls` (django-extensions) or `grep -rn "path(" */urls.py` |
| Rails | `bin/rails routes` |
| Express/Fastify | `grep -rnE "\.(get|post|put|delete)\(['\"]/" src` |

2. Group routes into journeys a real user completes end to end (for example "sign up, verify email, land on dashboard"), not single pages.
3. Add every journey named in `journey_sources` (incidents, support tags, owner list) even if no route matched yet.
4. Write each candidate as one line: `id | title | start_url | final observable outcome`.

### Output
Candidate journey list.

### Quality Gate
- Every route from step 1 belongs to at least one candidate or is listed as "not a user journey" (health check, static asset, admin-only debug).
- Every journey named in `journey_sources` appears in the list.

---

## Phase 2: Score Against the Risk Table

### Entry Criteria
- Candidate list exists.

### Actions
1. Tag each candidate with every row that applies. Tags are yes/no facts, not opinions:

| Tag | Applies when |
|---|---|
| `money` | The journey creates a charge, refund, payout, invoice or subscription change. |
| `access` | Sign up, sign in, sign out, password reset, MFA, SSO, role change. |
| `irreversible` | The journey deletes data, sends an external message (email, SMS, webhook) or submits to a third party. |
| `compliance` | Consent, data export, account deletion, audit-logged action named by a regulation or contract. |
| `traffic` | The start page or event is in the top entries of the analytics export in `journey_sources`. |
| `incident` | A past incident, postmortem or support tag names this journey. |
| `cross_system` | The outcome is only visible after two or more services cooperate (UI, API, queue, email). |

2. Select a journey for E2E when it has `access` or `money`, or has two or more tags. Every other candidate is rejected.
3. For each rejected candidate, name the lower layer that should cover it: pure UI state goes to component tests, a single endpoint's rules go to API tests, calculation logic goes to unit tests.
4. Do not add a journey because it is "easy to automate". Ease is not on the table.

### Output
Selected and rejected lists with tags.

### Quality Gate
- Every selected journey has `access` or `money` or at least two tags (count them in the output).
- Every rejected journey names a covering layer.

---

## Phase 3: Write Journey Specs

### Entry Criteria
- At least one journey selected.

### Actions
1. Walk each selected journey by hand at `app_url` in a browser and record each user action as one step: `click button "Place order"`, `fill label "Email" with <new user email>`.
2. Name each element by its visible role and accessible name (button text, label text, heading text). These names feed the selector policy flow later.
3. Write `end_state_assertion` as something visible to the user or checkable through the app's own API: "heading 'Order confirmed' visible and order appears in GET /api/orders". Never "no error".
4. List `test_data_needed` (accounts, products, feature flags) and `external_dependencies` (payment provider, email, maps, analytics).
5. List `roles` needed (anonymous, member, admin).

### Output
`critical_journeys`.

### Quality Gate
- Every selected journey has at least one step and a non-empty `end_state_assertion` that names a visible element or an API check.
- Every step names an element by visible text or label, not by CSS class.

---

## Worked Example

Illustrative only. Input: `repo_dir=/srv/shop`, `app_url=http://localhost:3000`, `journey_sources={incidents: ["2026-03 coupon double-charge"]}`.

Phase 1: `find app -name "page.tsx"` prints 14 routes. Candidates: `signup`, `login`, `browse-catalog`, `checkout-card`, `apply-coupon`, `edit-profile`, `delete-account`.

Phase 2 tags:
```
signup          access, cross_system (welcome email)       -> selected
checkout-card   money, cross_system                        -> selected
apply-coupon    money, incident                            -> selected
delete-account  irreversible, compliance                   -> selected
browse-catalog  traffic                                    -> rejected: component tests for filters
edit-profile    (none)                                     -> rejected: API tests on PATCH /api/me
```

Phase 3 spec for `checkout-card`: start `/products/blue-mug`; steps `click button "Add to cart"`, `click link "Cart"`, `click button "Checkout"`, `fill label "Card number" with 4242 4242 4242 4242` (provider test card); end state `heading "Order confirmed" visible and GET /api/orders returns the order`.

---

## Exit Criteria

DONE when `critical_journeys` lists every selected journey with steps, an observable end state, data needs and dependencies, and every rejected candidate names the test layer that covers it instead.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `app_url` does not answer | **Stop**: ask the user to start the app; E2E specs written without walking the app contain guessed element names. |
| Phase 1 | Router not in the table | **Adjust**: ask the user for the route list or read the router config file directly; do not guess routes. |
| Phase 2 | Every candidate qualifies | **Return**: show the tag counts to the user and ask which to drop; do not trim silently. |
| Phase 3 | A step cannot be completed by hand (blocked by CAPTCHA, real payment) | **Adjust**: record it as an external dependency for the mock-vs-real decision flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
