# Svelte 5 Runes Component Build

**One-line description:** Implements one Svelte 5 component with runes from its contract: `$props()` with `$bindable` for two-way state, `$state` and `$derived` for local and computed values, `$effect` with a returned cleanup for DOM side effects, callback props instead of `createEventDispatcher`, snippets instead of slots, and a clean `svelte-check` run.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Repository root.
- `component_path` (string, required): Target `.svelte` path.
- `component_contract` (object, required): Props, state, events, snippets and exported functions.
- `state_ownership_spec` (object, required): Which states are `$bindable`.
- `styling_decision` (object, required): Scoped `<style>` rules and ARIA selectors.
- `aria_spec` (object, required): Roles, states, properties and id sources.

---

## Outputs

- `svelte_build_report` (object): Svelte version, runes mode confirmation, files created, and the verbatim tail of the `svelte-check` run (0 errors).

---

## Phase 1: Version and Mode Gate

### Entry Criteria
- `component_path` ends in `.svelte` and does not exist.

### Actions
1. Run `npm ls svelte svelte-check @sveltejs/kit --depth=0`. Record the Svelte version.
2. If Svelte major is 4 or lower: stop. This flow covers Svelte 5 runes only; Svelte 4 uses `export let`, `$:` and `createEventDispatcher`.
3. Check whether the repo forces runes mode: look for `compilerOptions: { runes: true }` in `svelte.config.js`. Without it, a component enters runes mode when it uses any rune. Do not mix legacy syntax (`export let`, `$:`) with runes in one component; the compiler rejects it.
4. Id source: if Svelte is 5.20 or later, use `const uid = $props.id();` (stable across server rendering and hydration). Otherwise accept an `id` prop.
5. Baseline: run `npx svelte-check --threshold error` (or the repo's `"check"` script). Record the error count.

### Output
Version, id source, baseline.

### Quality Gate
- Svelte major is 5 or later, copied from `npm ls`.
- Baseline error count recorded.

---

## Phase 2: Write the Component

### Entry Criteria
- Runes mode confirmed.

### Actions
1. Create only `component_path` and, if logic is shared, a `.svelte.ts` module (runes work in `.svelte.ts`/`.svelte.js` files, not plain `.ts`).
2. Props in one destructure with a TypeScript type:
   ```svelte
   <script lang="ts">
     import type { Snippet } from 'svelte';
     type Props = { options: Option[]; value?: string | null; onvaluechange?: (v: string | null) => void;
                    label: string; option?: Snippet<[Option, boolean]>; class?: string };
     let { options, value = $bindable(null), onvaluechange, label, option, class: className, ...rest }: Props = $props();
   </script>
   ```
3. Local state: `let open = $state(false); let activeIndex = $state(-1);`
4. Computed: `const filtered = $derived(options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())));` Use `$derived.by(() => { ... })` for multi-statement logic. Never compute derived values inside `$effect` and assign them to `$state`.
5. Events: DOM events are attributes (`onclick={...}`, `onkeydown={...}`), not `on:click`. Component events are callback props (`onvaluechange?.(next)`).
6. Two-way writes: `value = next; onvaluechange?.(next);` so both `bind:value` and callback consumers work.
7. Effects: only for side effects outside Svelte (document listeners, observers, third-party widgets). Return the cleanup:
   ```ts
   $effect(() => {
     if (!open) return;
     const onDown = (e: PointerEvent) => { if (!root?.contains(e.target as Node)) open = false; };
     document.addEventListener('pointerdown', onDown);
     return () => document.removeEventListener('pointerdown', onDown);
   });
   ```
   `$effect` does not run during server rendering; do not put required markup logic in it.
8. Element refs: `let input: HTMLInputElement | undefined = $state();` with `bind:this={input}`.
9. Snippets: render optional custom option content with `{#if option}{@render option(o, i === activeIndex)}{:else}{o.label}{/if}`. Default children are `children` rendered with `{@render children?.()}`.
10. ARIA: `aria-expanded={open}` renders `"true"`/`"false"`; for `aria-activedescendant` pass `undefined` to omit it.

### Output
Component source.

### Quality Gate
- `grep -nE "export let|\\$:|createEventDispatcher|on:[a-z]" <component_path>` prints nothing.
- Every `$effect` that adds a listener or observer contains a `return () =>` cleanup: count of `addEventListener` equals count of `removeEventListener`.
- `git status --porcelain` lists only planned files.

---

## Phase 3: svelte-check

### Entry Criteria
- File written.

### Actions
1. Run `npx svelte-check --threshold warning`. Read each line: `<file>:<line>:<col> Error|Warn <message> (<code>)`.
2. Fix every error and warning in your file. Common codes: `state_referenced_locally` (you read a `$state` value once at setup instead of reactively; wrap in `$derived` or read inside a function), `a11y_*` warnings (fix the markup; do not suppress with `<!-- svelte-ignore -->`).
3. Rerun until your file reports 0 errors and 0 warnings. Record the summary line (`svelte-check found N errors and M warnings`).

### Output
`svelte_build_report`.

### Quality Gate
- Summary line errors equal baseline; your file has 0 errors and 0 warnings.
- `grep -n "svelte-ignore" <component_path>` prints nothing.

---

## Worked Example

Illustrative. `component_path` = `src/lib/components/MenuButton.svelte`, `npm ls` prints `svelte@5.28.2`.

- Phase 1: runes mode by usage; id source `$props.id()`; baseline 0 errors.
- Phase 2: `let { items, onselect, label }: Props = $props(); let open = $state(false); const uid = $props.id();` Button: `<button id="{uid}-btn" aria-haspopup="menu" aria-expanded={open} aria-controls="{uid}-menu" onclick={() => (open = !open)}>`.
- Phase 3: first run prints `MenuButton.svelte:22:5 Warn ... a11y_click_events_have_key_events`; the `div` is replaced by the `ul role="menu"` with a keydown handler; rerun prints `svelte-check found 0 errors and 0 warnings`.

---

## Exit Criteria

DONE when the component uses runes only, every effect with a listener returns cleanup, callback props replace dispatchers, and `svelte-check` reports zero errors and warnings for the file.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Svelte 4 installed | **Stop**: report that this flow is for Svelte 5; do not upgrade Svelte inside a component task. |
| Phase 2 | `effect_update_depth_exceeded` at runtime | **Adjust**: the effect writes state it reads; move the computation to `$derived`. |
| Phase 3 | Warning from a dependency file | **Adjust**: ignore files outside your component; compare to baseline. |
| Phase 3 | Same warning after three fixes | **Return**: report code, line and message. |

---

## Do Not

- Do not use `$effect` to sync one piece of state into another.
- Do not destructure `$props()` twice or call it in a function.
- Do not mutate a non-bindable prop; the compiler warns `ownership_invalid_mutation` in development.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
