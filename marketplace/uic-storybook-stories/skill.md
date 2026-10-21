# Storybook CSF3 Stories with Play Functions

**One-line description:** Writes Component Story Format 3 stories for one component (one story per meaningful state from the contract), typed with `Meta`/`StoryObj` and `satisfies`, with `args`, `argTypes`, interaction `play` functions that assert ARIA state, the a11y addon enabled, autodocs tags, and a passing `storybook build` plus story test run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Component to document.
- `component_contract` (object, required): Props, states and behaviors.
- `stack` (string, required): `react`, `vue` or `svelte`; decides the framework package and story syntax.

---

## Outputs

- `story_files` (object): Story file path, story ids (for example `components-combobox--open`), the play-function assertions per story, Storybook version, and the build and test run summaries.

---

## Phase 1: Confirm Storybook and Version

### Entry Criteria
- Component compiles.

### Actions
1. `npx storybook --version` and `npm ls storybook @storybook/addon-a11y @storybook/test --depth=0`. Record the major version.
2. If Storybook is absent, ask before running `npx storybook@latest init`; it edits `package.json` and adds `.storybook/`.
3. Import paths by major (verify against the installed packages; they moved):

   | Storybook | `expect`, `fn`, `userEvent`, `within` | Framework types (`Meta`, `StoryObj`) |
   |---|---|---|
   | 8.x | `@storybook/test` | `@storybook/react-vite`, `@storybook/vue3-vite`, `@storybook/svelte-vite` (or `@storybook/react` etc.) |
   | 9.x and later | `storybook/test` | same framework packages |

4. Framework package by stack: React `@storybook/react-vite` (or `@storybook/nextjs`), Vue `@storybook/vue3-vite`, Svelte `@storybook/svelte-vite` (or `@storybook/sveltekit`). Read `.storybook/main.*` `framework` to confirm.
5. Confirm `@storybook/addon-a11y` is in `.storybook/main.*` `addons`.

### Output
Version and import table.

### Quality Gate
- Storybook major and framework recorded from command output and `main.*`.
- a11y addon present or its absence recorded with an install request.

---

## Phase 2: Write Stories

### Entry Criteria
- Imports known.

### Actions
1. Create `<Name>.stories.ts` (React may use `.tsx`; Svelte can use `.stories.svelte` with `@storybook/addon-svelte-csf`, or plain CSF `.stories.ts`; follow the repo).
2. Meta:
   ```ts
   const meta = {
     title: 'Components/Combobox',
     component: Combobox,
     tags: ['autodocs'],
     args: { label: 'Country', options, onValueChange: fn() },
     argTypes: { value: { control: 'text' } },
   } satisfies Meta<typeof Combobox>;
   export default meta;
   type Story = StoryObj<typeof meta>;
   ```
   `fn()` creates a spy that the Actions panel logs and play functions can assert.
3. One story per state: `Default`, `WithValue`, `Open`, `NoResults`, `Disabled`, `Invalid`, `LongLabels` (text expansion), `RightToLeft` (decorator wrapping in `<div dir="rtl">`). Story id = kebab of title + export name (`components-combobox--no-results`).
4. Play functions put the component in the state and assert it:
   ```ts
   export const Open: Story = {
     play: async ({ canvasElement, args }) => {
       const canvas = within(canvasElement);
       const input = canvas.getByRole('combobox', { name: 'Country' });
       await userEvent.click(input);
       await userEvent.keyboard('{ArrowDown}');
       await expect(input).toHaveAttribute('aria-expanded', 'true');
     },
   };
   ```
   Storybook 9 also passes `canvas` and `userEvent` in the play context; either form works there.
5. a11y addon behavior: set `parameters: { a11y: { test: 'error' } }` in meta so violations fail story tests (this parameter exists in recent versions; check the addon docs for yours).
6. Do not hardcode data that changes between runs (dates, random ids) in stories used for visual regression; fix them in args.

### Output
Story file.

### Quality Gate
- One story per contract state; story count recorded.
- Every interactive story has a `play` with at least one `expect`.
- `grep -nE "Math\.random|new Date\(\)" <stories file>` prints nothing.

---

## Phase 3: Build and Test Stories

### Entry Criteria
- Stories written.

### Actions
1. `npm run build-storybook` (or `npx storybook build`). Build must finish and write `storybook-static/`.
2. Run story tests with what the repo has:
   - Storybook 9 with Vitest addon (`@storybook/addon-vitest`): `npx vitest --project=storybook run` (project name from `vitest.config.*`).
   - Test runner: `npx http-server storybook-static -p 6006 --silent &` then `npx test-storybook --url http://127.0.0.1:6006`.
3. Read failures: each lists the story id and the failing `expect` or a11y violation. Fix the component or the story state, not by deleting the assertion.
4. Record story ids and summaries in `story_files`.

### Output
`story_files`.

### Quality Gate
- Build exit code 0 and `storybook-static/index.html` exists.
- Story test summary shows 0 failed.

---

## Worked Example

Illustrative. Storybook 8.6, React Vite.

- Phase 1: `npx storybook --version` prints `8.6.12`; imports from `@storybook/test`.
- Phase 2: `Combobox.stories.tsx` with 7 stories; `NoResults` play types `zzz` and asserts `canvas.getByRole('status')` has text "No results".
- Phase 3: `npm run build-storybook` writes `storybook-static`; `npx test-storybook --url http://127.0.0.1:6006` prints `Tests: 7 passed, 7 total`.

---

## Exit Criteria

DONE when every contract state has a story, interactive stories assert their state in `play`, a11y checks run per story, and both the static build and story tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Import path from the table not found | **Adjust**: read `node_modules/<pkg>/package.json` `exports` to find the right entry. |
| Phase 2 | Svelte component needs a snippet in a story | **Adjust**: use a wrapper story component or the Svelte CSF addon. |
| Phase 3 | test-storybook cannot connect | **Retry**: confirm the static server is listening on the URL; start it first. |
| Phase 3 | a11y violation in a story | **Return**: route to `uic-axe-a11y-check` fixes; do not set `a11y.test` to `off`. |

---

## Do Not

- Do not write stories that only render default props.
- Do not use `storiesOf` (removed legacy API).
- Do not remove `expect` calls to make story tests pass.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
