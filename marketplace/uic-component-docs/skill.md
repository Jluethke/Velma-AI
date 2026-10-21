# Component Documentation Page

**One-line description:** Produces the usage documentation for one component as a Storybook MDX docs page (plus a README section when the component ships in a package): prop table generated from source comments by the stack's docgen, controlled and uncontrolled examples embedded from real stories, the keyboard map table, ARIA and focus notes, i18n labels, and known limitations, with every example compiled by the Storybook build.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `component_contract` (object, required): Props, events, slots and open questions.
- `keyboard_map` (object, required): Keys and actions to publish.
- `story_files` (object, required): Story ids to embed.
- `component_path` (string, required): Component source, for prop comments.

---

## Outputs

- `component_docs` (object): MDX docs file path, README section path if any, list of sections present, and the Storybook build result proving the page compiles.

---

## Phase 1: Prop Comments for Docgen

### Entry Criteria
- `story_files` lists at least one story.

### Actions
1. Docgen source by stack (read `.storybook/main.*` for overrides):

   | Stack | Docgen | Comments it reads |
   |---|---|---|
   | React | `react-docgen` (Storybook 8 default) or `react-docgen-typescript` (`typescript.reactDocgen` option) | JSDoc `/** ... */` on each prop in the props type |
   | Vue | `vue-component-meta` or `vue-docgen-api` (`docgen` option of `@storybook/vue3-vite`) | JSDoc on `defineProps` type members and `defineEmits` |
   | Svelte | Svelte docgen built into `@storybook/svelte-vite` | JSDoc on the `Props` type members |

2. Add a one-sentence JSDoc to every prop, event and slot in `component_path`, including `@default` where the default is not visible in the type. Text comes from the contract descriptions; do not invent behavior.
3. Run the stack's typecheck after editing comments.

### Output
Commented props.

### Quality Gate
- Every prop in the contract has a JSDoc line in the source: count of `/**` above prop members equals the props count.
- Typecheck exit 0.

---

## Phase 2: Write the Docs Page

### Entry Criteria
- Comments in place.

### Actions
1. Create `<Name>.mdx` beside the stories. Doc block imports by Storybook major: 8.x `@storybook/blocks`; 9.x `@storybook/addon-docs/blocks`. Verify against installed packages.
2. Sections in this order:
   1. `<Meta of={ComboboxStories} />` and a one-paragraph purpose taken from the contract.
   2. "Usage": `<Canvas of={ComboboxStories.Default} />` and `<Controls />`.
   3. "Controlled and uncontrolled": canvases of `WithValue` and `Default`, plus a short code block showing `value`/`onValueChange` (React), `v-model` (Vue) or `bind:value` (Svelte).
   4. "Props": `<ArgTypes />` (or `<Controls />` if the team prefers live controls only).
   5. "Keyboard": a Markdown table copied from `keyboard_map` (key, action).
   6. "Accessibility": the governance engine pattern name and link, the accessible name requirement (consumers must pass `label`), focus behavior on open and close, and anything consumers must do (for example pass a unique `id` on React 17).
   7. "Internationalization": the `labels` prop keys and defaults, RTL support statement.
   8. "Known limitations" and the contract's open questions that affect consumers.
3. If the component lives in a published package, add the same Usage, Keyboard and Accessibility sections to the package README with plain code blocks.
4. Every code block must match a real story's args; do not write examples that no story renders.

### Output
MDX page and optional README section.

### Quality Gate
- `grep -c "^## " <Name>.mdx` shows all eight section headings.
- Keyboard table row count equals the non-native `keyboard_map` row count.
- Every `of={...}` reference names an existing story export.

---

## Phase 3: Build and Review

### Entry Criteria
- Page written.

### Actions
1. `npm run build-storybook`. MDX compile errors print the file and line; fix them.
2. Open the built docs page (`npx http-server storybook-static -p 6006`, then the component's Docs entry). Check that the props table lists every prop with its description and default.
3. Run the repo's spelling or Markdown lint if configured (`npx markdownlint-cli2 "**/*.mdx"` only if it is already a dev dependency).
4. Record results in `component_docs`.

### Output
`component_docs`.

### Quality Gate
- Build exit 0.
- Props table in the built page shows every contract prop (count match recorded).

---

## Worked Example

Illustrative. React `Combobox`, Storybook 8.

- Phase 1: 9 props get JSDoc, for example `/** Selected option key in controlled mode. Pass null for no selection. */ value?: string | null;`.
- Phase 2: `Combobox.mdx` with the eight sections; Keyboard table has 7 rows; Accessibility section links https://www.w3.org/WAI/ARIA/governance engine/patterns/combobox/.
- Phase 3: `npm run build-storybook` exit 0; Docs page props table shows 9 rows with descriptions.

---

## Exit Criteria

DONE when every prop has a source comment, the docs page has all eight sections with examples drawn from real stories, the keyboard table matches the map, and the Storybook build compiles it.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Props table empty in docs | **Adjust**: docgen not picking up the type; check the `reactDocgen`/`docgen` option and that props are exported types. |
| Phase 2 | Doc block import not found | **Adjust**: use the import path for the installed Storybook major. |
| Phase 3 | MDX compile error on `<` or `{` in text | **Adjust**: escape it or wrap in backticks. |
| Phase 3 | Open question unresolved affects usage | **Return**: list it under Known limitations; do not guess the answer. |

---

## Do Not

- Do not describe behavior the tests do not cover.
- Do not paste the props table by hand; let docgen generate it.
- Do not use marketing language in docs.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
