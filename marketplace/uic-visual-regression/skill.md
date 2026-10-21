# Visual Regression for Component Stories

**One-line description:** Adds visual regression to a component's Storybook stories with either Playwright `toHaveScreenshot()` against the static Storybook iframe (baselines generated inside the official Playwright Docker image so they match CI) or Chromatic, stabilizes rendering (fonts, animations, dynamic data), and reads a diff to decide between a real regression and an intended change.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `story_files` (object, required): Story ids and Storybook version from `uic-storybook-stories`.
- `visual_tool` (string, optional): `playwright` or `chromatic`. When absent, choose with the Phase 1 table.

---

## Outputs

- `visual_report` (object): Tool used, baseline location, story ids covered, run result, and for each diff the story id, diff image path or Chromatic link, and the regression-or-intended decision with reason.

---

## Phase 1: Choose the Tool

### Entry Criteria
- `storybook-static/` builds.

### Actions
1. If `visual_tool` is given, use it. Otherwise:

   | Condition | Tool |
   |---|---|
   | Repo already has `chromatic` in devDependencies or a Chromatic CI step | Chromatic |
   | Repo already has `@playwright/test` | Playwright |
   | Neither; team accepts a hosted service and its account setup | Chromatic |
   | Neither; everything must stay in the repo and CI | Playwright |

2. Record the reason row.

### Output
Tool choice.

### Quality Gate
- Tool and reason row recorded.

---

## Phase 2: Set Up and Stabilize

### Entry Criteria
- Tool chosen.

### Actions
1. Stabilize stories first (both tools): fixed args for dates and ids; fonts loaded before capture (self-host fonts in `.storybook/preview-head.html` or wait for `document.fonts.ready`); no running animations (`prefers-reduced-motion` honored, or Playwright `animations: 'disabled'`, the default for `toHaveScreenshot`); fixed viewport.
2. Playwright path:
   - `playwright.config.ts`: `webServer: { command: 'npx http-server storybook-static -p 6006 --silent', url: 'http://127.0.0.1:6006', reuseExistingServer: !process.env.CI }`, `use: { baseURL: 'http://127.0.0.1:6006' }`.
   - Test per story id:
     ```ts
     for (const id of ['components-combobox--default', 'components-combobox--open']) {
       test(id, async ({ page }) => {
         await page.goto(`/iframe.html?id=${id}&viewMode=story`);
         await page.evaluate(() => document.fonts.ready);
         await expect(page.locator('#storybook-root')).toHaveScreenshot(`${id}.png`);
       });
     }
     ```
     For stories with a `play` function, wait for the state it produces (for example `await expect(page.getByRole('listbox')).toBeVisible()`) before the screenshot.
   - Baselines are named with browser and platform suffixes (for example `-chromium-linux.png`), so a baseline made on Windows or macOS will not match Linux CI. Generate baselines in the Playwright image matching your `@playwright/test` version: `docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v<version>-noble npx playwright test --update-snapshots` (check the tag list on the Playwright Docker docs page for your version).
   - Tolerances: keep defaults unless a documented reason exists; `maxDiffPixels`, `maxDiffPixelRatio` and `threshold` are options of `toHaveScreenshot` if you need one, and the value must come from the team, recorded as a user input.
3. Chromatic path:
   - `npm i -D chromatic` (ask first). Store the project token as a CI secret named `CHROMATIC_PROJECT_TOKEN`.
   - Run `npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN`. First run creates baselines. Later runs exit nonzero when visual changes await review unless `--exit-zero-on-changes` is passed; keep the default in CI so changes block until reviewed.
   - Interaction states: Chromatic captures after `play` functions finish.

### Output
Configured visual tests and baselines.

### Quality Gate
- Every story id in `story_files` is covered (count matches).
- Playwright: baseline PNGs exist under the test's `-snapshots` folder with the Linux suffix; Chromatic: the build URL is recorded.
- A second run with no code change passes (no flaky diffs).

---

## Phase 3: Read Diffs and Decide

### Entry Criteria
- A run reports differences.

### Actions
1. Playwright: open `npx playwright show-report`; each failure shows Expected, Actual and Diff images (also in `test-results/<test>/` as `-expected.png`, `-actual.png`, `-diff.png`). Chromatic: open the build link; each change shows a side-by-side and a diff overlay.
2. Decide per diff:

   | Diff shows | Decision |
   |---|---|
   | Change matches an intended design or code change in this branch | Intended: update the baseline (`--update-snapshots` in the Docker image; Accept in Chromatic). |
   | Change in a component this branch did not touch | Regression: fix; do not update baseline. |
   | Anti-aliasing noise only, different on each run | Flaky: fix stabilization (fonts, animation, data); do not add tolerance first. |
   | Text overflow, clipped focus ring, misaligned icon | Regression: fix. |

3. Never update baselines on a run you have not inspected image by image.
4. Record each decision in `visual_report`.

### Output
`visual_report`.

### Quality Gate
- Every diff has a decision and reason.
- Final run passes (Playwright exit 0 or Chromatic build accepted).

---

## Worked Example

Illustrative. Playwright 1.5x, 7 Combobox stories.

- Phase 1: repo has `@playwright/test`; Playwright chosen.
- Phase 2: baselines generated in `mcr.microsoft.com/playwright:v1.5x.0-noble`; `components-combobox--open-chromium-linux.png` etc. Second run: `7 passed`.
- Phase 3: after a token change, `--open` fails with `1843 pixels (ratio 0.01 of all image pixels) are different`; diff shows the selected-option background color changed, which the branch intended; baseline updated in Docker and committed.

---

## Exit Criteria

DONE when every story has a baseline produced in the CI-matching environment or Chromatic, a no-change rerun is stable, and every diff has a recorded decision.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Local baseline differs from CI | **Adjust**: regenerate baselines in the Docker image matching CI. |
| Phase 2 | Second unchanged run shows diffs | **Adjust**: stabilize fonts, animations and data; rerun. |
| Phase 3 | Unclear whether a diff is intended | **Stop**: ask the change author; do not accept. |
| Phase 3 | Chromatic token missing in CI | **Stop**: request the secret; never commit the token. |

---

## Do Not

- Do not raise diff tolerances to hide failures.
- Do not run `--update-snapshots` blindly.
- Do not commit baselines generated on a developer laptop when CI runs Linux.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
