# Playwright Visual Comparison with toHaveScreenshot

**One-line description:** Adds screenshot assertions with `expect(page).toHaveScreenshot()` for chosen screens, generates and updates baselines only inside the pinned Playwright Docker image so fonts and rendering match CI, masks dynamic regions with `mask`, keeps the default `animations: 'disabled'` and `caret: 'hide'`, and reads diff images to tell a real regression from noise.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Absolute path to the repository.
- `pw_node_config` (object, required): From `e2e-node-pw-setup`; supplies `playwright_version`.
- `visual_targets` (object[], optional): Screens or components to compare: `{name, url, locator|null, dynamic_regions[], tolerance|null}`. `tolerance` is the user's chosen `maxDiffPixels` or `maxDiffPixelRatio`; when null the Playwright defaults apply.

---

## Outputs

- `visual_baselines` (object): `{snapshot_dir, specs[], docker_update_command, baseline_files[], tolerance_settings[], diff_review[]}`.

---

## Phase 1: Choose Targets and Stabilize Them

### Entry Criteria
- `visual_targets` is non-empty. Otherwise skip this flow.
- Docker is installed: `docker --version`.

### Actions
1. Prefer element screenshots of stable components over full pages: `await expect(page.getByTestId('price-card')).toHaveScreenshot('price-card.png')`. Full pages pick up unrelated changes.
2. For each dynamic region (clock, avatar, random recommendations, ads), add it to `mask`: `mask: [page.getByTestId('last-login')]`. Masked areas are painted with a solid box (color set by `maskColor`).
3. Freeze time-based content with `await page.clock.setFixedTime(new Date('2026-01-15T10:00:00Z'))` before `goto` when dates render (check that `page.clock` exists in your `playwright_version`).
4. Wait for web fonts before the shot when the page loads them late: `await page.evaluate(() => document.fonts.ready)`.
5. Do not add `waitForTimeout` to "let it settle". `toHaveScreenshot` already takes screenshots until two consecutive ones match before comparing.

### Output
Stabilized target list.

### Quality Gate
- Every dynamic region in `visual_targets` maps to a `mask` entry or a frozen value.

---

## Phase 2: Generate Baselines in the Pinned Container

### Entry Criteria
- Targets stabilized.

### Actions
1. Get the exact version: `npx playwright --version` (for example `Version 1.48.2`). The image tag is `mcr.microsoft.com/playwright:v1.48.2-noble`. The versions must match or browsers will not launch.
2. Generate baselines inside it:
```
docker run --rm --ipc=host --network host -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.48.2-noble \
  /bin/bash -c "npm ci && npx playwright test e2e/visual.spec.ts --update-snapshots"
```
   `--network host` lets the container reach an app on the host (Linux). On Docker Desktop (macOS/Windows) use `BASE_URL=http://host.docker.internal:3000` instead.
3. Baselines are written next to the spec in `<spec>-snapshots/<name>-<project>-<platform>.png`, for example `visual.spec.ts-snapshots/price-card-chromium-linux.png`. A `-darwin` or `-win32` file means it was generated outside the container; delete it.
4. Commit the `-linux.png` files. Never generate baselines on a laptop and compare in CI; font hinting and anti-aliasing differ by OS.
5. Tolerance: leave the defaults (`threshold: 0.2` per-pixel color distance, no pixel count allowance) unless `visual_targets.tolerance` is given. Never raise tolerance to make a failing comparison pass.

### Output
Baseline PNGs.

### Quality Gate
- `find e2e -name "*-snapshots" -exec ls {} \;` lists only `-linux.png` files.
- Running the same container command without `--update-snapshots` passes twice in a row.

---

## Phase 3: Read Diffs

### Entry Criteria
- A visual test failed.

### Actions
1. Open the report: `npx playwright show-report`. Each failure has three images: Expected, Actual, Diff (changed pixels highlighted), and a slider view.
2. Classify with this table:

| Diff shows | Cause | Response |
|---|---|---|
| Whole text blocks shifted by a pixel, glyph edges only | Rendering environment differs | Regenerate in the container; check the CI image tag matches |
| A masked region's neighbor moved | Layout change from content length | Real change: confirm with the user |
| Intended design change | Real change | Update with `--update-snapshots` in the container; commit with the design change |
| Spinner or skeleton in Actual | Shot taken before load | Add a web-first wait for the loaded state before the screenshot |

3. Update baselines only in the same commit as the UI change that caused them, and list them in the PR.

### Output
`visual_baselines` with `diff_review`.

### Quality Gate
- Every updated PNG in `git diff --stat` has a `diff_review` entry naming its cause row.

---

## Worked Example

Illustrative only.
```
$ docker run --rm --ipc=host --network host -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.48.2-noble /bin/bash -c "npm ci && npx playwright test e2e/visual.spec.ts --update-snapshots"
  2 passed
$ ls e2e/visual.spec.ts-snapshots/
price-card-chromium-linux.png  header-chromium-linux.png
```
Later failure: `Error: Screenshot comparison failed: 1820 pixels (ratio 0.02 of all image pixels) are different.` Diff shows the price text moved down: a padding change in `PriceCard.css` in the same PR. Confirmed with the user, baseline updated in the container.

---

## Exit Criteria

DONE when each target has a stabilized screenshot assertion, baselines exist only as container-generated `-linux.png` files, two container runs pass, and every baseline update is tied to a classified diff.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `browserType.launch: Executable doesn't exist` in container | **Adjust**: image tag and `@playwright/test` version differ; align them. |
| Phase 2 | App unreachable from container | **Adjust**: use `--network host` on Linux or `host.docker.internal` on Docker Desktop. |
| Phase 3 | Diffs differ every run | **Stop**: a dynamic region is unmasked; find it in the Diff image and mask or freeze it. |
| Phase 3 | User asks to raise tolerance to pass | **Return**: show the diff image; record the chosen value as a user decision in `tolerance_settings`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
