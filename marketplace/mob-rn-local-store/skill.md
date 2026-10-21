# React Native Local Persistence

**One-line description:** Picks AsyncStorage, MMKV, SecureStore/Keychain, or SQLite (expo-sqlite or op-sqlite) per data kind, implements SQLite schema versioning with `PRAGMA user_version` migrations inside transactions, guards JSON reads against corrupt values, and tests the store with the official Jest mocks.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `data_model` (object, required): Entities, fields, secret vs cache, expected record volume per entity, current shipped schema version.

---

## Outputs

- `rn_store` (object): Library per data kind, file paths, migration list, test results.

---

## Phase 1: Choose the Library per Data Kind

### Entry Criteria
- `app_profile.stack` is `react-native`.

### Actions
1. Apply, preferring what `app_profile.libraries.storage` already has:

| Data kind | Library |
|---|---|
| Secrets | `expo-secure-store` (Expo) or `react-native-keychain` (bare) |
| Small non-secret settings | `react-native-mmkv` if present; else `@react-native-async-storage/async-storage` |
| Records you query, filter or page | `expo-sqlite` (Expo) or `@op-engineering/op-sqlite` (bare); WatermelonDB only if already present |
| Server-state cache | TanStack Query persister (see `mob-rn-network-offline`), not a second copy |

2. AsyncStorage limits: on Android the total database size defaults to 6 MB, configurable with `AsyncStorage_db_size_in_MB` in `android/gradle.properties` (AsyncStorage docs). Do not put lists that grow without bound in AsyncStorage; use SQLite.
3. Never store tokens in AsyncStorage or MMKV without encryption.

### Output
Decision table for this app.

### Quality Gate
- Each entity maps to one library row.
- `grep -rn "AsyncStorage.setItem" src | grep -iE "token|password|secret"` prints nothing.

---

## Phase 2: Implement Schema Versioning

### Entry Criteria
- Phase 1 complete; SQLite chosen for at least one entity, or skip to Phase 3 for key-value only.

### Actions
1. Migrations as an ordered array; each entry moves `user_version` up by exactly one:
```ts
const MIGRATIONS: string[][] = [
  /* 0 -> 1 */ ['CREATE TABLE orders (id TEXT PRIMARY KEY NOT NULL, total_cents INTEGER NOT NULL, updated_at INTEGER NOT NULL)'],
  /* 1 -> 2 */ ['ALTER TABLE orders ADD COLUMN note TEXT'],
];
export async function migrate(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let v = row?.user_version ?? 0;
  for (; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      for (const sql of MIGRATIONS[v]) await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
```
   (`getFirstAsync`, `execAsync`, `withTransactionAsync` are the `expo-sqlite` API from SDK 50; for op-sqlite use its `execute`/`transaction` API; check the installed version's docs.)
2. Run `migrate` once at startup before any screen queries. Enable WAL once: `PRAGMA journal_mode = WAL`.
3. Never edit an entry that has shipped; append a new one.
4. Use bound parameters (`runAsync('INSERT ... VALUES (?, ?)', [id, cents])`), never string concatenation of user input.
5. Key-value reads: wrap `JSON.parse` in `try/catch`; on failure remove the key and return the default, and log it.

### Output
Migration module and repository functions.

### Quality Gate
- `npx tsc --noEmit` exits 0.
- `grep -rn 'Async(.*\${' src/db | grep -v user_version` prints nothing (no template-literal SQL except the version pragma).

---

## Phase 3: Tests

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Key-value: `jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'))`. Test the corrupt-JSON path by `setItem('k', '{bad')` then reading the default.
2. SQLite migrations are native code; Jest cannot run them. Unit-test the migration array shape in Jest (strictly increasing, no edits to shipped entries: compare against a committed snapshot with `toMatchSnapshot()`), and run the real migration in an on-device Detox test (see `mob-rn-detox-tests`) that installs the previous app build, writes rows, installs the new build over it, and reads them.
3. Run `npx jest src/db`.

### Output
`rn_store`.

### Quality Gate
- Jest prints no failures; the snapshot file is committed.
- The on-device upgrade test is listed for the Detox suite, or marked `not run` with the reason.

---

## Worked Example

Illustrative only. Expo SDK 52, orders list up to several thousand rows, auth token.

Phase 1: token in `expo-secure-store`; orders in `expo-sqlite`; theme flag in AsyncStorage.

Phase 2: two migrations, `PRAGMA user_version` reaches 2 on fresh install.

Phase 3:
```
$ npx jest src/db
 PASS  src/db/migrations.test.ts
 PASS  src/db/settings.test.ts
Tests:       4 passed, 4 total
Snapshots:   1 passed, 1 total
```

---

## Exit Criteria

DONE when each data kind uses the right library, SQLite migrations are append-only and transactional, JSON reads survive corruption, and tests cover shape and upgrade.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `Database or disk is full` from AsyncStorage on Android | **Adjust**: move the data to SQLite; raising the size limit only delays it. |
| Phase 2 | `duplicate column name` on upgrade | **Adjust**: a shipped migration was edited or `user_version` not set inside the transaction; restore and append. |
| Phase 2 | `NativeModule: AsyncStorage is null` | **Adjust**: rebuild the native app after install (`pod install`), not just reload. |
| Phase 3 | Snapshot mismatch on migrations | **Stop**: a shipped migration changed; revert it rather than updating the snapshot. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
