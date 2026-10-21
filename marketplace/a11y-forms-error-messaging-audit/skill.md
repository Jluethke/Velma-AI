# Forms and Error Messaging Audit

**One-line description:** Audits every form field and every error state for labels and instructions (1.3.1, 3.3.2, 4.1.2), input purpose `autocomplete` tokens (1.3.5), error identification and suggestion (3.3.1, 3.3.3), error prevention for legal and financial data (3.3.4), redundant entry (3.3.7), accessible authentication (3.3.8) and announced status messages (4.1.3).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `page_inventory` (object[], required): Output of `a11y-scope-inventory`; rows with forms and their error states.
- `component_inventory` (object[], required): Output of `a11y-scope-inventory`; form field components.

---

## Outputs

- `form_issues` (object[]): One row per failure: `issue_id` (FM001, ...), `sc`, `page_id`, `component_id` or null, `selector`, `field_label` (visible text), `check` (the row name from the tables below), `expected`, `actual`, `blocks_task`, `source` = "forms".

---

## Phase 1: Field Inventory with Accessible Names

### Entry Criteria
- Inventory rows include at least one form, or the flow ends with an empty output.

### Actions
1. On each form page run this in the DevTools Console to list every field and how it is named:
   ```js
   [...document.querySelectorAll('input:not([type=hidden]),select,textarea,[role=textbox],[role=combobox],[role=checkbox],[role=radio],[role=switch]')].map(el => ({
     sel: el.id ? '#' + el.id : el.name ? `[name="${el.name}"]` : el.outerHTML.slice(0, 60),
     type: el.type || el.getAttribute('role'),
     label: el.labels ? [...el.labels].map(l => l.textContent.trim()).join(' | ') : '',
     ariaLabel: el.getAttribute('aria-label'),
     labelledby: el.getAttribute('aria-labelledby'),
     describedby: el.getAttribute('aria-describedby'),
     placeholder: el.getAttribute('placeholder'),
     autocomplete: el.getAttribute('autocomplete'),
     required: el.required || el.getAttribute('aria-required')
   }))
   ```
   Wrap with `console.table(...)` to read it; copy the output as evidence.
2. Confirm the computed name in DevTools, Elements, Accessibility pane, "Computed Properties", Name. The Accessibility pane is the source of truth, not the markup.
3. Apply the label checks:

   | Check | SC | Fail when |
   |---|---|---|
   | has-name | 4.1.2 | Accessibility pane Name is empty |
   | visible-label | 3.3.2 | no visible label or instruction; placeholder-only fields fail because the placeholder disappears on input |
   | label-in-name | 2.5.3 | the accessible name does not contain the visible label text (for example visible "Email", `aria-label="Input 3"`) |
   | label-associated | 1.3.1 | visible label exists but is not programmatically tied (`<label for>` matching `id`, wrapping `<label>`, or `aria-labelledby`) |
   | group-label | 1.3.1 | a radio or checkbox group has no `<fieldset>` with `<legend>` or `role="group"`/`radiogroup` with a name |
   | required-indicated | 3.3.2 | required fields are not indicated in text or by a symbol explained on the form (color alone fails 1.4.1) |
   | format-instructions | 3.3.2 | a field needs a format (date, phone) and the format is not stated before input |

4. Input purpose (1.3.5): for each field that collects information about the user, check `autocomplete` holds the matching token from the HTML specification's autofill field names: `name`, `given-name`, `family-name`, `email`, `tel`, `street-address`, `address-line1`, `address-level2` (city), `postal-code`, `country`, `bday`, `cc-name`, `cc-number`, `cc-exp`, `cc-csc`, `username`, `current-password`, `new-password`, `one-time-code`, and others in the spec list. Missing or wrong tokens fail 1.3.5. axe rule `autocomplete-valid` catches invalid values but not missing ones.

### Output
Label and purpose rows.

### Quality Gate
- Every field on every form page appears in the saved Console table.
- Every field collecting user data has its `autocomplete` value recorded (including "missing").

---

## Phase 2: Error States

### Entry Criteria
- Phase 1 done.

### Actions
1. For each form, submit it empty, then submit it with one invalid value per field (wrong email format, letters in a number field). Use keyboard only and keep NVDA or VoiceOver running if available.
2. Apply the error checks:

   | Check | SC | Fail when |
   |---|---|---|
   | error-identified-in-text | 3.3.1 | the field in error is shown only by red border or icon, with no text naming the problem |
   | error-programmatic | 3.3.1, 4.1.2 | the error text is not tied to the field (`aria-describedby` pointing to the error element id, or `aria-errormessage` with `aria-invalid="true"`); screen reader does not read the error on focus |
   | invalid-state | 4.1.2 | the field in error lacks `aria-invalid="true"` (or the native `:invalid` state is used without a text message) |
   | suggestion | 3.3.3 | the error says only "invalid" when a correction is known (for example "Enter a date as DD/MM/YYYY") |
   | error-announced | 4.1.3 | after submit, focus does not move to the first error or an error summary, and no live region announces the error count |
   | error-summary-links | 2.4.3 | an error summary exists but its links do not move focus to the fields |
   | preserves-input | 3.3.7 | after an error, valid fields the user already filled are cleared |
   | prevention | 3.3.4 | a form that makes a legal commitment, a financial transaction, or changes or deletes user data has no review step, no confirmation, and no way to reverse |

3. `aria-errormessage` support differs across screen readers. When the site uses it, confirm the message is heard in NVDA and VoiceOver; if it is not heard in one of them, record `error-programmatic` and suggest `aria-describedby`, which is widely supported.

### Output
Error-state rows.

### Quality Gate
- Every form has two recorded submissions (empty and invalid) with the result of each check.
- Every `error-announced` result is backed by a screen reader transcript or by `document.activeElement` output after submit.

---

## Phase 3: WCAG 2.2 Form Criteria

### Entry Criteria
- Phase 2 done.

### Actions
1. Redundant Entry (3.3.7, level A): in each multi-step process from the inventory, list every piece of information asked twice. Fail when the user must type it again and it is not auto-filled or selectable, unless re-entry is essential, required for security, or the earlier value is no longer valid. A "billing address same as shipping" checkbox satisfies it.
2. Accessible Authentication (Minimum) (3.3.8, level AA): on login, sign-up, and verification steps, fail when a step needs a cognitive function test (remembering a password, transcribing a code, solving a puzzle) and none of these is offered: an alternative method without the test, a mechanism to assist (password manager autofill, copy and paste), object recognition, or personal content the user gave. In practice check:
   - Paste works in password and one-time code fields: paste a value with Ctrl+V or Command+V. Search source for blockers: `rg -n "onPaste|onpaste|@paste|\(paste\)|addEventListener\(['\"]paste" src`.
   - Password fields have `autocomplete="current-password"` or `new-password` and are not split across several inputs that defeat password managers.
   - One-time codes have `autocomplete="one-time-code"` and accept paste of the whole code when split into boxes.
   - A CAPTCHA that asks to transcribe distorted text or solve a puzzle has an alternative that is not a cognitive function test.
3. Mark `blocks_task` = true for any failure on a login, sign-up or checkout step.

### Output
`form_issues`.

### Quality Gate
- Every process in the inventory has a recorded redundant-entry check result.
- Every authentication step has a recorded paste test result (paste worked or blocked).

---

## Worked Example

Illustrative only. P05 `/checkout/shipping`, state error.

Phase 1 Console table excerpt:
```
sel            type   label   ariaLabel  placeholder        autocomplete
#fullname      text           null       "Full name"        null
#zip           text   ZIP     null       null               null
```
Rows: FM001 `has-name`/`visible-label` for `#fullname` (placeholder only, `sc` 3.3.2 and 4.1.2); FM002 1.3.5 for `#fullname` (needs `name`) and `#zip` (needs `postal-code`).

Phase 2: empty submit shows red borders and a toast "Please fix errors". `document.activeElement` after submit is the Continue button; NVDA says nothing. Rows FM003 3.3.1 (no field-level text), FM004 4.1.3 (not announced).

Phase 3: P06 `/checkout/payment` asks for the billing address with no "same as shipping" option. Row FM005 3.3.7.

---

## Exit Criteria

DONE when every field has a recorded accessible name and purpose result, every form was submitted empty and invalid with all error checks recorded, and every process and authentication step has 3.3.7 and 3.3.8 results.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fields live in a shadow root and the query finds none | **Adjust**: select the host element in DevTools and run the query on `$0.shadowRoot`. |
| Phase 2 | Submitting creates real orders or emails | **Stop**: use a staging environment or test payment mode; never submit to production. |
| Phase 2 | Client validation disabled by `novalidate` and server returns a page reload | **Adjust**: test the reloaded page as the error state, including where focus lands. |
| Phase 3 | Authentication is a third-party hosted page | **Adjust**: test it anyway and record the vendor; it is part of the process for conformance. |

**Do not:** accept a placeholder as a label; mark an error as identified because it is red; skip the paste test.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
