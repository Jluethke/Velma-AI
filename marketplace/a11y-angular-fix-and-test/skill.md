# Angular Accessibility Fix and Component Test

**One-line description:** Applies each fix plan task in an Angular codebase one task at a time: writes a failing axe-core plus `@testing-library/angular` test on the TestBed fixture first, makes the smallest template change using native elements and Angular CDK a11y (`cdkTrapFocus`, `LiveAnnouncer`, `FocusMonitor`) and the Router `title` strategy, enables the angular-eslint template accessibility rules, and commits only when test, lint and suite pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fix_plan` (object[], required): Output of `a11y-fix-plan-by-criterion`.
- `repo_dir` (string, required): Angular workspace path (contains `angular.json`).

---

## Outputs

- `angular_fix_log` (object[]): One row per task: `task_id`, `status` (fixed, blocked, needs-owner), `files_changed`, `test_file`, `test_failed_before`, `test_passes_after`, `lint_clean`, `suite_passed`, `commit`, `notes`.

---

## Phase 1: Prepare Test and Lint Tooling

### Entry Criteria
- `angular.json` exists; record `npx ng version`.
- Baseline suite run recorded: `npx ng test --watch=false` (Karma) or the configured Jest or Vitest runner.

### Actions
1. Install: `npm install --save-dev axe-core @testing-library/angular @testing-library/user-event`. Using `axe-core` directly works in Karma, Jest and Vitest without a runner-specific matcher.
2. Lint: if `@angular-eslint` is not set up, run `npx ng add @angular-eslint/schematics`. Then enable the accessibility rules for templates. In a flat config (`eslint.config.js`) for `**/*.html` files, include `...angular.configs.templateAccessibility` (from `angular-eslint`); in a legacy `.eslintrc.json`, add `"plugin:@angular-eslint/template/accessibility"` to `extends` for `*.html`. Confirm the exact export name in the angular-eslint README for your version.
3. Record the baseline: `npx ng lint` and count `@angular-eslint/template/*` accessibility rule errors (for example `alt-text`, `elements-content`, `label-has-associated-control`, `click-events-have-key-events`, `interactive-supports-focus`, `valid-aria`, `role-has-required-aria`, `table-scope`, `no-autofocus`).

### Output
Tools ready, baselines recorded.

### Quality Gate
- `npx ng lint` runs and the output or `--print-config` shows template accessibility rules enabled.
- Baseline test result recorded.

---

## Phase 2: Red: Failing Test for One Task

### Entry Criteria
- Phase 1 complete; take the first task without a status.

### Actions
1. Write the test next to the component, for example `src/app/cart/cart-item.component.spec.ts`:
   ```ts
   import { render, screen } from '@testing-library/angular';
   import axe from 'axe-core';
   import { CartItemComponent } from './cart-item.component';

   it('has no axe violations', async () => {
     const { fixture } = await render(CartItemComponent, { inputs: { item: { name: 'Shirt', qty: 1 } } });
     const results = await axe.run(fixture.nativeElement);
     expect(results.violations.map(v => v.id)).toEqual([]);
   });

   it('remove button has a name', async () => {
     await render(CartItemComponent, { inputs: { item: { name: 'Shirt', qty: 1 } } });
     expect(screen.getByRole('button', { name: 'Remove Shirt' })).toBeTruthy();
   });
   ```
   On older `@testing-library/angular` versions, inputs are passed with `componentProperties` instead of `inputs`; check the installed version's docs.
2. Asserting on `violations.map(v => v.id)` prints the rule ids when it fails, which is easier to read than a count.
3. jsdom and Karma's headless Chrome differ: in Karma (real Chrome) axe can evaluate color contrast; in Jest with jsdom it cannot. Do not claim contrast is tested in jsdom.
4. Run only this spec: `npx ng test --include src/app/cart/cart-item.component.spec.ts --watch=false` (Karma), or `npx jest src/app/cart/cart-item.component.spec.ts`. It must fail for the task's reason.

### Output
A failing test.

### Quality Gate
- The test fails before the change with a message naming the expected role and name or axe rule ids.

---

## Phase 3: Green: Smallest Template Change

### Entry Criteria
- A failing test for the current task.

### Actions
1. Edit only the task's files.
2. Apply the Angular pattern:

   | Problem | Angular fix |
   |---|---|
   | icon button name | `<button type="button" [attr.aria-label]="'Remove ' + item.name"><mat-icon aria-hidden="true">delete</mat-icon></button>`; use `[attr.aria-label]`, the attribute binding form that works in every Angular version (older versions reject `[aria-label]` with "Can't bind to 'aria-label'") |
   | label | `<label [for]="id">` with `<input [id]="id">` |
   | error tied to field | `[attr.aria-invalid]="ctrl.invalid && ctrl.touched"` and `[attr.aria-describedby]="ctrl.invalid ? id + '-err' : null"` |
   | announcement | inject `LiveAnnouncer` from `@angular/cdk/a11y` and call `this.announcer.announce('Added to cart', 'polite')` |
   | modal focus | Angular Material `MatDialog` (handles focus and restore), or `cdkTrapFocus [cdkTrapFocusAutoCapture]="true"` on a custom dialog container, and return focus to the trigger on close |
   | focus origin styling | `FocusMonitor` to style keyboard focus differently from mouse focus; never remove focus styles |
   | page title | route `title: 'Cart'` in the routes array (Angular 14 and later), or a custom `TitleStrategy` |
   | route focus | subscribe to `NavigationEnd` from `Router.events` and focus the page `h1` (`tabindex="-1"`) |
   | clickable element | `<button>` instead of `<div (click)>`; angular-eslint `click-events-have-key-events` and `interactive-supports-focus` flag the old form |

3. Run the spec until it passes, `npx ng lint` (no new template accessibility errors), then the full suite.
4. Commit: `git commit -m "a11y(FX004): cart remove button named (WCAG 4.1.2, ARIA6)"`.

### Output
`angular_fix_log` row. Repeat Phases 2 and 3 per task.

### Quality Gate
- Every fixed row has `test_failed_before` and `test_passes_after` true.
- Full suite passes or fails only on baseline failures.
- `npx ng lint` shows no new accessibility rule errors.

---

## Worked Example

Illustrative only. Task FX004 (cart "Remove" icon button has no name, 4.1.2).

```
$ npx ng test --include src/app/cart/cart-item.component.spec.ts --watch=false
  FAILED  has no axe violations
    Expected [ 'button-name' ] to equal [  ].
  FAILED  remove button has a name
    Unable to find an accessible element with the role "button" and name "Remove Shirt"
```
Change: `[attr.aria-label]="'Remove ' + item.name"` on the button and `aria-hidden="true"` on the `mat-icon`.
```
$ npx ng test --include src/app/cart/cart-item.component.spec.ts --watch=false
  TOTAL: 2 SUCCESS
$ npx ng lint
  All files pass linting.
```

---

## Exit Criteria

DONE when every `fix_plan` task has an `angular_fix_log` row, and every fixed row has a red-then-green spec, no new lint errors, a green suite, and its own commit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ng add @angular-eslint/schematics` conflicts with an existing TSLint setup | **Stop**: report it; migrating the linter is a separate task the owner approves. |
| Phase 2 | Component needs providers (HttpClient, Router) | **Adjust**: pass `providers: [provideHttpClientTesting(), provideRouter([])]` in `render` options, per the Angular testing docs for your version. |
| Phase 3 | Angular Material component lacks an accessible name option | **Adjust**: read the component's API docs for `aria-label` inputs (many have `ariaLabel` inputs); do not override its internal DOM. |

**Do not:** mix binding styles for ARIA in one codebase (use `[attr.aria-*]`); delete or `xit` failing specs; disable template accessibility rules; fix several tasks per commit; claim fixed without running the spec.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
