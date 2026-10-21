# Node commander Parser

**One-line description:** Implements the spec's commands and flags with `commander` (subcommands, `Option` with choices and env binding, custom value parsers with `InvalidArgumentError`), overrides commander's default exit code 1 to the spec's usage-error code with `exitOverride()`, and tests the parser in-process.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Node project (contains `package.json`).

---

## Outputs

- `parser_module` (string): Path of the module exporting `buildProgram()`, for example `src/cli.js`.
- `parser_check_log` (string): Captured test run output and manual checks.

---

## Phase 1: Program and Options

### Entry Criteria
- `cli_spec.parser_library` == `commander`.
- `npm ls commander` prints an installed version. Record the major version and read its CHANGELOG entries for that major before writing code; behavior around excess arguments changed between majors.

### Actions
1. Create `src/cli.js` only. Export a factory so each test gets a fresh program (commander keeps parsed state on the instance):
```js
import { Command, Option, InvalidArgumentError } from 'commander';
import { createRequire } from 'node:module';
const { version } = createRequire(import.meta.url)('../package.json');

function positiveInt(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) throw new InvalidArgumentError('must be a positive integer');
  return n;
}

export function buildProgram() {
  const program = new Command();
  program
    .name('logtrim')
    .description('Trim old log lines and report counts.')
    .version(version, '--version')
    .option('-v, --verbose', 'more detail on stderr', (_, prev) => prev + 1, 0)
    .addOption(new Option('--color <when>').choices(['auto', 'always', 'never']).default('auto').env('LOGTRIM_COLOR'))
    .showHelpAfterError('(add --help for usage)');
  program
    .command('trim')
    .description('drop lines older than DURATION')
    .requiredOption('--older-than <duration>')
    .option('-i, --in-place')
    .option('--max-files <n>', 'stop after n files', positiveInt)
    .argument('[files...]')
    .action(async (files, opts, cmd) => { /* call the real implementation */ });
  return program;
}
```
2. Map spec types with this table:

| Spec type | commander |
|---|---|
| bool, default false | `.option('-i, --in-place')` |
| bool, default true | `.option('--no-color')` (value `color` defaults to `true`) |
| count | custom parser `(_, prev) => prev + 1` with default `0` |
| repeatable | `(value, prev) => prev.concat([value])` with default `[]` |
| enum | `new Option(...).choices([...])` |
| env var | `new Option(...).env('NAME')` |
| int | custom parser that throws `InvalidArgumentError` |
| required option | `.requiredOption(...)` |
| zero or more operands | `.argument('[files...]')`; one or more `'<files...>'` |

3. Read options with `cmd.opts()` (or the `opts` action parameter). `--older-than` becomes `olderThan` (camelCase).
4. Pass the `-V` default only if the spec reserves it. Commander's default version flags are `-V, --version`; the call above uses `--version` alone to match the spec.

### Output
`src/cli.js` with `buildProgram()`.

### Quality Gate
- `node bin/logtrim.js --help` exits 0 and lists every command in `cli_spec`.
- `grep -n "parseInt)" src/cli.js` returns nothing (see Do Not).

---

## Phase 2: Exit Code Override

### Entry Criteria
- Program builds.

### Actions
1. Commander exits 1 on unknown options, missing arguments and invalid values. Map those to the spec's usage-error code:
```js
import { CommanderError } from 'commander';
export async function main(argv = process.argv) {
  const program = buildProgram().exitOverride();
  try {
    await program.parseAsync(argv);
    return 0;
  } catch (err) {
    if (err instanceof CommanderError) {
      if (err.exitCode === 0) return 0; // --help, --version (codes commander.helpDisplayed, commander.version)
      return 2; // usage problem; commander already wrote the message to stderr
    }
    process.stderr.write(`logtrim: ${err.message}\n`);
    return 1;
  }
}
```
2. `exitOverride()` applies to the command it is called on and is inherited by subcommands added after it; call it before `.command(...)` definitions if you restructure `buildProgram`, or call it on each subcommand.
3. Use `parseAsync` whenever any action is `async`. `parse` does not wait for async actions, so errors escape as unhandled rejections.
4. In `bin/logtrim.js` (first line `#!/usr/bin/env node`):
```js
import { main } from '../src/cli.js';
process.exitCode = await main();
```
   Set `process.exitCode` instead of calling `process.exit()`, so pending stdout writes to a pipe finish before the process ends.

### Output
`main()` returning spec exit codes.

### Quality Gate
- `node bin/logtrim.js trim --older-than 1d --bogus; echo $?` prints `error: unknown option '--bogus'` on stderr and `2`.
- `node bin/logtrim.js --version; echo $?` prints the `package.json` version and `0`.

---

## Phase 3: Parser Tests

### Entry Criteria
- `main()` exists.

### Actions
1. Create `test/cli-parser.test.js` using the built-in runner (`node:test`):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProgram, main } from '../src/cli.js';

test('unknown option is a usage error', async () => {
  const code = await main(['node', 'logtrim', 'trim', '--older-than', '1d', '--bogus']);
  assert.equal(code, 2);
});

test('older-than lands in olderThan', async () => {
  const p = buildProgram().exitOverride();
  const trim = p.commands.find(c => c.name() === 'trim');
  trim.action(() => {});
  await p.parseAsync(['trim', '--older-than', '1d'], { from: 'user' });
  assert.equal(trim.opts().olderThan, '1d');
});
```
2. Silence commander's stderr in tests with `.configureOutput({ writeErr: () => {} })` when asserting only codes.
3. Run `node --test` and save the output as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- `node --test` reports `# fail 0`.
- One test asserts code 2 for a bad flag; one asserts a camelCase option value.

---

## Do Not

- Do not pass `parseInt` directly as an option parser. Commander calls the parser as `(value, previous)`, so `parseInt(value, previous)` uses the previous value as the radix.
- Do not call `process.exit()` in action handlers; return or throw and let `main` set the code.
- Do not invent commander methods. Confirm a method exists in the README for your installed major.

---

## Worked Example

Illustrative. commander 12 project, `logtrim` spec:
```
$ node bin/logtrim.js trim --older-than 1d --bogus
error: unknown option '--bogus'
(add --help for usage)
$ echo $?
2
$ node --test
# tests 4
# pass 4
# fail 0
```

---

## Exit Criteria

DONE when every command and option in `cli_spec` is declared, usage errors exit with the spec code instead of commander's default 1, help and version exit 0, and the tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project is CommonJS (`"type"` not `module`) | **Adjust**: use `const { Command } = require('commander')` and `require('../package.json')`. |
| Phase 2 | Help exits 2 after override | **Adjust**: log `err.code` and `err.exitCode`; keep the `err.exitCode === 0` check first so help and version stay 0. |
| Phase 2 | Async action errors print `UnhandledPromiseRejection` | **Adjust**: switch to `parseAsync` and `await` it. |
| Phase 3 | Test fails | **Retry**: fix `src/cli.js`; never change the expected code. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
