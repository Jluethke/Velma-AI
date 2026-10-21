# Node yargs Parser

**One-line description:** Implements the spec's commands and flags with `yargs` in strict mode (commands with positionals, typed options, `.env()` prefix binding, `.demandCommand()`), stops yargs from coercing numeric-looking strings, maps validation failures to the spec's usage-error code with `.fail()`, and tests with `exitProcess(false)`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `cli_spec` (object, required): Interface contract from `cli-spec-commands-flags-exits`.
- `exit_code_table` (object[], required): Exit codes from the same flow.
- `project_dir` (string, required): Root of the Node project.

---

## Outputs

- `parser_module` (string): Path of the module exporting `buildParser(argv)`, for example `src/cli.js`.
- `parser_check_log` (string): Captured test output and manual checks.

---

## Phase 1: Commands and Options

### Entry Criteria
- `cli_spec.parser_library` == `yargs`.
- `npm ls yargs` prints a version. Record the major. Check the yargs README for that major's module format (recent majors are ESM-first; confirm whether `require('yargs')` is supported before writing CommonJS).

### Actions
1. Create `src/cli.js` only:
```js
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export function buildParser(args) {
  return yargs(args)
    .scriptName('logtrim')
    .usage('$0 <command> [options]')
    .env('LOGTRIM')
    .option('verbose', { alias: 'v', type: 'count', describe: 'more detail on stderr' })
    .option('color', { choices: ['auto', 'always', 'never'], default: 'auto' })
    .command('trim [files..]', 'drop lines older than DURATION', y => y
      .positional('files', { type: 'string', array: true })
      .option('older-than', { type: 'string', demandOption: true, describe: 'DURATION' })
      .option('in-place', { alias: 'i', type: 'boolean', default: false })
      .option('id', { type: 'string' }))
    .command('stats [files..]', 'count lines per level', y => y
      .option('json', { type: 'boolean', conflicts: 'format' })
      .option('format', { choices: ['table', 'csv'] }))
    .demandCommand(1, 'a command is required')
    .strict()
    .help('help').alias('help', 'h')
    .version()
    .wrap(null);
}

export const parse = () => buildParser(hideBin(process.argv));
```
2. Always call `.strict()`. Without it, unknown flags and unknown commands are accepted silently.
3. Give every string-valued option `type: 'string'`. Without a type, yargs-parser converts numeric-looking values to numbers, so `--id 007` becomes `7`.
4. Positionals declared in the command string (`trim [files..]`) need a matching `.positional()` call to get a type.
5. `.env('LOGTRIM')` binds `LOGTRIM_OLDER_THAN` to `--older-than` (prefix plus uppercase, dashes to underscores). Flags on the command line win over env values.
6. Map spec types:

| Spec type | yargs option |
|---|---|
| bool | `type: 'boolean'` (gets `--no-x` automatically) |
| count | `type: 'count'` |
| repeatable | `type: 'array'` or `type: 'string', array: true` |
| enum | `choices: [...]` |
| required | `demandOption: true` |
| mutually exclusive | `conflicts: 'other'` |
| number | `type: 'number'` (check for `NaN` in a `.check()`) |

### Output
`src/cli.js` with `buildParser`.

### Quality Gate
- `node bin/logtrim.js --help` exits 0 and lists every command in `cli_spec`.
- Every option with a string value has `type: 'string'` (read each `.option` call).

---

## Phase 2: Failure Handling and Exit Codes

### Entry Criteria
- Parser builds.

### Actions
1. yargs prints the error and usage, then exits 1 on validation failure. Replace with the spec code:
```js
export async function main(args) {
  let code = 0;
  const parser = buildParser(args)
    .exitProcess(false)
    .fail((msg, err, y) => {
      if (err) throw err;            // a real exception from a handler
      process.stderr.write(`logtrim: ${msg}\nTry 'logtrim --help'.\n`); // a custom .fail() replaces yargs' own printing
      code = 2;
    });
  try {
    await parser.parseAsync();
  } catch (err) {
    process.stderr.write(`logtrim: ${err.message}\n`);
    return 1;
  }
  return code;
}
```
2. Use `parseAsync()` when any command handler is `async`.
3. With `exitProcess(false)`, `--help` and `--version` print and then return; confirm `code` stays 0 for them.
4. In `bin/logtrim.js` (first line `#!/usr/bin/env node`): `import { main } from '../src/cli.js'; import { hideBin } from 'yargs/helpers'; process.exitCode = await main(hideBin(process.argv));`. Set `process.exitCode` rather than calling `process.exit()`, so stdout drains.

### Output
`main()` returning spec exit codes.

### Quality Gate
- `node bin/logtrim.js trim --older-than 1d --bogus; echo $?` prints an `Unknown argument: bogus` message on stderr and `2`.
- `node bin/logtrim.js stats --json --format csv; echo $?` prints an `mutually exclusive` message and `2`.

---

## Phase 3: Tests

### Entry Criteria
- `main()` exists.

### Actions
1. Create `test/cli-parser.test.js` with `node:test`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildParser, main } from '../src/cli.js';

test('unknown flag exits 2', async () => {
  assert.equal(await main(['trim', '--older-than', '1d', '--bogus']), 2);
});

test('id stays a string', async () => {
  const argv = await buildParser(['trim', '--older-than', '1d', '--id', '007']).exitProcess(false).parseAsync();
  assert.equal(argv.id, '007');
});

test('env binds older-than', async () => {
  process.env.LOGTRIM_OLDER_THAN = '2d';
  try {
    const argv = await buildParser(['trim']).exitProcess(false).parseAsync();
    assert.equal(argv.olderThan, '2d');
  } finally { delete process.env.LOGTRIM_OLDER_THAN; }
});
```
2. yargs exposes both `argv['older-than']` and `argv.olderThan` (camel-case expansion). Assert the form your handlers use.
3. Run `node --test`; save the output as `parser_check_log`.

### Output
`parser_module`, `parser_check_log`.

### Quality Gate
- `node --test` reports `# fail 0`.
- Tests cover a usage error, the string-typing rule and env binding.

---

## Do Not

- Do not leave `.strict()` off to make a test pass. Fix the option declaration.
- Do not call `.argv` and `.parse()` on the same instance; each parses again and runs handlers twice.
- Do not invent option keys. The accepted keys are listed under `.option(key, [opt])` in the yargs API docs.

---

## Worked Example

Illustrative. Before step 3 of Phase 1, `--id 007` produced `argv.id === 7`. After adding `type: 'string'`:
```
$ node bin/logtrim.js trim --older-than 1d --bogus
logtrim: Unknown argument: bogus
Try 'logtrim --help'.
$ echo $?
2
$ node --test
# tests 3
# pass 3
# fail 0
```

---

## Exit Criteria

DONE when strict parsing rejects unknown input with the spec usage code, string values are never coerced, env binding works, and the tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `ERR_REQUIRE_ESM` when loading yargs | **Adjust**: convert the entry to ESM (`"type": "module"`) or use a yargs major that supports `require`. |
| Phase 2 | `.fail()` swallows a handler exception | **Adjust**: rethrow when `err` is set, as in the sample. |
| Phase 2 | Help returns 2 | **Adjust**: only set `code = 2` inside `.fail()`; help does not call it. |
| Phase 3 | Env leaks between tests | **Adjust**: delete the variable in `finally`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
