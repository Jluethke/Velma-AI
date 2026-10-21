# Vue 3 Composition API Component Build

**One-line description:** Implements one Vue 3 single-file component with `<script setup lang="ts">` from its contract: type-based `defineProps` and `defineEmits`, `defineModel` for two-way state, `useId` and `useTemplateRef` when the installed Vue version has them, a composable for reusable logic, lifecycle and watcher cleanup, and a clean `vue-tsc` and `eslint-plugin-vue` run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Target `.vue` path.
- `component_contract` (object, required): Props, state, events, slots and ref tables.
- `state_ownership_spec` (object, required): Which states use `defineModel`.
- `styling_decision` (object, required): `<style scoped>` or `<style module>` and the ARIA-selector rules.
- `aria_spec` (object, required): Roles, states, properties and id sources.

---

## Outputs

- `vue_build_report` (object): Vue version, files created, and the verbatim tail of `vue-tsc --noEmit` and ESLint runs (both exit 0).

---

## Phase 1: Version Gate

### Entry Criteria
- `component_path` ends in `.vue` and does not exist.

### Actions
1. Run `npm ls vue vue-tsc eslint-plugin-vue --depth=0`. Record the Vue minor version.
2. Feature availability (from the Vue release notes):

   | Feature | Minimum Vue | Fallback below it |
   |---|---|---|
   | `defineModel()` | 3.4 | `modelValue` prop + `emit('update:modelValue')` |
   | `defineOptions({ inheritAttrs: false })` | 3.3 | separate `<script>` block exporting `inheritAttrs: false` |
   | `useId()` | 3.5 | `id` prop and derived child ids |
   | `useTemplateRef('name')` | 3.5 | `const name = ref<HTMLElement \| null>(null)` with matching `ref="name"` |
   | Reactive props destructure (`const { label = 'Search' } = defineProps<...>()`) | 3.5 | `withDefaults(defineProps<...>(), {...})` and `props.label` |
   | `onWatcherCleanup()` | 3.5 | third argument `onCleanup` of the `watch` callback |

3. Baseline: run `npx vue-tsc --noEmit` and `npx eslint <component_dir_parent> --ext .vue,.ts` (flat config: `npx eslint <dir>`). Record error counts.

### Output
Feature table filled with "use" or "fallback" per row.

### Quality Gate
- Vue version is copied from `npm ls` output.
- Every feature row is marked use or fallback.

---

## Phase 2: Write the SFC

### Entry Criteria
- Feature table complete.

### Actions
1. Create only `component_path`, plus `use<Name>.ts` composable if logic will be shared or exceeds what reads clearly in one file, plus `index.ts` if sibling folders have one.
2. Script block order: imports, `defineOptions`, `defineProps<Props>()`, `defineEmits<{ select: [key: string]; close: [] }>()` (named-tuple syntax, Vue 3.3+), `defineModel` calls, refs, computed, functions, watchers, lifecycle hooks.
3. Props: never write to a prop. Derived values use `computed(() => ...)`.
4. Two-way state: `const selected = defineModel<string | null>({ default: null })`. Assign `selected.value = next`; the emit happens automatically.
5. Reactivity pitfalls to avoid:
   - Destructuring a `reactive()` object loses reactivity; use `toRefs()` or keep `state.x`.
   - Passing `props.x` into a composable passes a snapshot; pass `() => props.x` or `toRef(props, 'x')` and read with `toValue()` (3.3+).
   - Replacing a `reactive()` object wholesale breaks references; use `ref()` for values you replace.
6. Ids: `const baseId = useId()`; `listboxId = baseId + '-listbox'`.
7. Attributes: if the root element is not the passthrough element, set `inheritAttrs: false` and bind `v-bind="$attrs"` on the passthrough element.
8. Cleanup: every `addEventListener` in `onMounted` has a matching `removeEventListener` in `onBeforeUnmount` with the same function reference; every `watch` that starts async work cancels it with `onWatcherCleanup` or `onCleanup` (for example `AbortController.abort()`).
9. Slots: declare slot types with `defineSlots<{ option(props: { option: Option; active: boolean }): any }>()` (3.3+) so consumers get typed slot props.
10. ARIA: bind with `:aria-expanded="open"` (Vue renders booleans on `aria-*` attributes as `"true"`/`"false"`); remove `aria-activedescendant` with `:aria-activedescendant="activeId ?? undefined"`.

### Output
SFC and optional composable.

### Quality Gate
- `git status --porcelain` lists only planned files.
- `grep -nE "props\.[a-zA-Z]+ *=" <component_path>` prints nothing (no prop mutation).
- Count of `addEventListener` equals count of `removeEventListener` in the component and composable.

---

## Phase 3: Typecheck and Lint

### Entry Criteria
- Files written.

### Actions
1. Run `npx vue-tsc --noEmit`. Fix new errors in your files only.
2. Run ESLint with `eslint-plugin-vue` (config `plugin:vue/recommended` or flat `pluginVue.configs['flat/recommended']`; check the plugin README for your version). Fix all findings in your files.
3. Write `vue_build_report` with the last 5 lines of each run.

### Output
`vue_build_report`.

### Quality Gate
- `vue-tsc --noEmit` error count equals baseline.
- ESLint exit code 0 for the component directory, no `eslint-disable` comments added.

---

## Worked Example

Illustrative. `component_path` = `src/components/AppTabs/AppTabs.vue`, `npm ls` prints `vue@3.5.13`.

- Phase 1: all features "use".
- Phase 2: `const active = defineModel<string>('active', { required: true })`; `const tabRefs = useTemplateRef<HTMLButtonElement[]>('tabs')`; tab buttons render `:id="baseId + '-tab-' + t.key"`, `:aria-selected="t.key === active"`, `:tabindex="t.key === active ? 0 : -1"`.
- Phase 3: `npx vue-tsc --noEmit` prints nothing, exit 0; `npx eslint src/components/AppTabs` exit 0.

---

## Exit Criteria

DONE when the SFC uses only features available in the installed Vue version, never mutates props, pairs every listener and async watcher with cleanup, and passes `vue-tsc` and ESLint at baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `vue-tsc` not installed | **Stop**: ask to add it as a dev dependency; do not skip typechecking. |
| Phase 2 | `vue/no-mutating-props` fires | **Adjust**: switch that state to `defineModel` or a local `ref` initialized from the prop. |
| Phase 3 | `vue-tsc` and editor disagree | **Adjust**: trust `vue-tsc`; check that `tsconfig.json` includes the `.vue` files. |
| Phase 3 | Error persists after three attempts | **Return**: report file, line and message to the user. |

---

## Do Not

- Do not mix Options API and `<script setup>` in the same component.
- Do not use `this` in `<script setup>`.
- Do not call `defineProps` inside a function or condition; compiler macros are top-level only.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
