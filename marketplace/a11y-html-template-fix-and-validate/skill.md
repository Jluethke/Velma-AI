# Server-Rendered Template Fix and Validation

**One-line description:** Applies each fix plan task in server-rendered HTML templates (Django, Jinja2, Rails ERB, Laravel Blade, or static HTML) one task at a time, validating the rendered output (not the template source) with html-validate's accessibility rules and a per-page Playwright axe check before and after, and fixing shared base layouts and partials first.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_plan` (object[], required): Output of `a11y-fix-plan-by-criterion`.
- `repo_dir` (string, required): Repository containing the templates.
- `site_url` (string, required): Base URL of a locally running or staging server that renders the templates.

---

## Outputs

- `html_fix_log` (object[]): One row per task: `task_id`, `status` (fixed, blocked, needs-owner), `files_changed`, `rendered_pages_checked`, `validate_errors_before`, `validate_errors_after`, `axe_violations_before`, `axe_violations_after`, `suite_passed`, `commit`, `notes`.

---

## Phase 1: Set Up Rendered-Output Validation

### Entry Criteria
- The site runs locally or on staging and `curl -s -o /dev/null -w "%{http_code}" <site_url>` prints 200.

### Actions
1. Install: `npm install --save-dev html-validate` in a tooling folder (Node is needed even for a Python, Ruby or PHP app).
2. Create `.htmlvalidate.json`:
   ```json
   { "extends": ["html-validate:recommended", "html-validate:a11y"] }
   ```
   Check the preset names against the html-validate docs ("Presets") for your installed version. The a11y-related rules include `wcag/h30` (link has text), `wcag/h32` (form has submit button), `wcag/h36` (image button has alt), `wcag/h37` (img has alt), `wcag/h63` (th has scope where needed), `wcag/h67` (decorative image has no title), `wcag/h71` (fieldset has legend), plus `input-missing-label`, `empty-heading`, `empty-title`, `no-redundant-role`, `prefer-native-element`, `unique-landmark`.
3. Validate rendered HTML, never the template file, because template tags are not HTML:
   ```
   curl -s "<site_url>/checkout/shipping" -o rendered/P05.html
   npx html-validate rendered/P05.html
   ```
   Pages behind login: add `-b "sessionid=<value>"` (Django), `-b "_app_session=<value>"` (Rails) or the app's session cookie name to `curl`.
4. Identify the project's own test command and record its baseline result: Django `python manage.py test`, pytest `pytest`, Rails `bin/rails test` or `bundle exec rspec`, Laravel `php artisan test`.

### Output
Rendered-output validation working and a baseline test result.

### Quality Gate
- `npx html-validate rendered/P05.html` (or any page) runs and prints rule ids or no output.
- Baseline result of the project's own test command recorded.

---

## Phase 2: Measure Before, for One Task

### Entry Criteria
- Phase 1 complete; take the first task without a status.

### Actions
1. Find every page the task affects (its issues' `page_ids`). Render each with `curl` and run `npx html-validate` on it. Save the error count as `validate_errors_before`.
2. Run the Playwright axe scan from `a11y-axe-playwright-scan` for those pages only: `npx playwright test a11y/scan.spec.ts -g "P05"`, and count violations with `jq '.violations|length' axe-out/P05.json`. Save as `axe_violations_before`.
3. Locate the template line. Follow inheritance: a field rendered by a form library is often defined in Python or Ruby, not in the template:

   | Framework | Where markup comes from |
   |---|---|
   | Django forms | widget templates (`django/forms/widgets/*.html`), `{{ form.as_p }}`, or field `widget=forms.TextInput(attrs={...})` in `forms.py` |
   | Jinja2 | macros in `{% import %}` files |
   | Rails | `form_with` helpers (`f.label`, `f.text_field`), partials under `app/views/**/_*.html.erb`, layouts under `app/views/layouts` |
   | Laravel Blade | components under `resources/views/components`, layouts via `@extends` and `@section` |

### Output
Before counts and the exact line to change.

### Quality Gate
- `validate_errors_before` and `axe_violations_before` are recorded for every affected page.
- The file and line to change are recorded.

---

## Phase 3: Change, Re-Render, Compare

### Entry Criteria
- Phase 2 complete.

### Actions
1. Edit only the files in the task. Fix in the base layout or shared partial when the problem appears on every page (`lang` on `<html>`, skip link, landmarks, title block).
2. Use the framework's attribute mechanism instead of hand-written HTML where a helper exists:
   - Django: `forms.EmailField(widget=forms.EmailInput(attrs={'autocomplete': 'email'}))`; labels via `{{ field.label_tag }}`; errors with `aria-describedby` pointing to the error element id (render the error list with an `id` such as `{{ field.auto_id }}_error`). Django 5.0 and later adds `aria-describedby` for help text automatically; check the release notes of your version before adding it by hand.
   - Rails: `f.label :email` plus `f.email_field :email, autocomplete: "email", "aria-describedby": "email_error"`.
   - Blade and Jinja2: add attributes in the component or macro once.
   - Every page: `<html lang="{{ LANGUAGE_CODE }}">` (Django) or `<html lang="<%= I18n.locale %>">` (Rails).
3. Restart or reload the server if templates are cached, re-render each affected page with `curl`, run `npx html-validate` and the axe scan again. Record `_after` counts.
4. The task's target rule must be gone from both outputs, and no new rule ids may appear. Run the project's test command; it must match baseline or be better.
5. Commit: `git commit -m "a11y(FX005): base layout sets html lang (WCAG 3.1.1, H57)"`.

### Output
`html_fix_log` row. Repeat Phases 2 and 3 per task.

### Quality Gate
- For every fixed row, the target rule id appears in the before output and not in the after output for every affected page.
- `validate_errors_after` is less than or equal to `validate_errors_before` and `axe_violations_after` is less than `axe_violations_before` on every affected page.
- The project's test command result matches or improves on baseline.

---

## Worked Example

Illustrative only. Django site, task FX005 (missing `lang`, 3.1.1, all pages).

```
$ curl -s http://localhost:8000/ -o rendered/P01.html
$ jq '[.violations[].id]' axe-out/P01.json
["html-has-lang", "label"]
```
Change in `templates/base.html`: `<html>` becomes `<html lang="{{ LANGUAGE_CODE }}">` with `{% get_current_language as LANGUAGE_CODE %}` after `{% load i18n %}`.
```
$ curl -s http://localhost:8000/ -o rendered/P01.html && rg -o '<html lang="[^"]+"' rendered/P01.html
<html lang="en-us"
$ npx playwright test a11y/scan.spec.ts -g "P01" && jq '[.violations[].id]' axe-out/P01.json
["label"]
$ python manage.py test
Ran 112 tests ... OK
```

---

## Exit Criteria

DONE when every task has an `html_fix_log` row, and every fixed row shows the target rule removed from the rendered output of every affected page with no new rule ids and a test suite at or better than baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | html-validate reports hundreds of non-accessibility errors | **Adjust**: write JSON with `npx html-validate --formatter json rendered/P05.html > v.json`, read the rule ids with `jq '[.[].messages[].ruleId]' v.json`, and compare only the a11y rule ids; do not fix unrelated markup now. |
| Phase 3 | Change not visible after re-render | **Retry**: clear the template cache (restart the dev server; Django cached loader, Rails `tmp/cache`, Laravel `php artisan view:clear`). |
| Phase 3 | Fix requires changing a third-party form library's widget | **Adjust**: override the widget template in the project's templates folder as the framework documents; do not edit installed packages. |

**Do not:** run html-validate on template source files; hand-edit generated HTML; fix several tasks in one commit; claim success without re-rendering.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
