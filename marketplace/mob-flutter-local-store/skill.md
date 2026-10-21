# Flutter Local Persistence and Migration

**One-line description:** Picks drift, sqflite, shared_preferences or flutter_secure_storage per data kind, implements versioned schemas with drift `MigrationStrategy` (step-by-step) or sqflite `onUpgrade`, regenerates code with build_runner, and tests migrations on the host with in-memory or FFI databases.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `data_model` (object, required): Entities, fields, secret vs cache, current shipped schema version.

---

## Outputs

- `flutter_store` (object): Package per data kind, schema/database file paths, migrations, test results.

---

## Phase 1: Choose Packages

### Entry Criteria
- `app_profile.stack` is `flutter`.

### Actions
1. Apply, preferring what `pubspec.yaml` already has:

| Data kind | Package |
|---|---|
| Secrets | `flutter_secure_storage` (Keychain on iOS, Keystore-backed on Android) |
| Small settings | `shared_preferences` (use `SharedPreferencesAsync` or `SharedPreferencesWithCache` on 2.3+; the legacy `SharedPreferences.getInstance()` API still works) |
| Records with queries, reactive lists | `drift` |
| Records, project already on raw SQL | `sqflite` |

2. Do not add a second database package when one exists. Do not store secrets in `shared_preferences`.

### Output
Package decisions.

### Quality Gate
- Each entity maps to one row; `grep -rn "setString" lib | grep -iE "token|password|secret"` prints nothing.

---

## Phase 2: Schema and Migrations

### Entry Criteria
- Phase 1 complete.

### Actions
1. drift:
```dart
@DriftDatabase(tables: [Orders])
class AppDb extends _$AppDb {
  AppDb(super.e);
  @override int get schemaVersion => 2;
  @override MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from < 2) await m.addColumn(orders, orders.note);
    },
    beforeOpen: (details) async { await customStatement('PRAGMA foreign_keys = ON'); },
  );
}
```
   Newer drift versions add `stepByStep(...)` helpers and `dart run drift_dev make-migrations` to export schemas and generate migration tests. Use them if the installed `drift_dev` supports them (check `dart run drift_dev --help`).
2. Regenerate after every table change: `dart run build_runner build --delete-conflicting-outputs`. Commit generated `*.g.dart` only if the project already commits them.
3. sqflite:
```dart
final db = await openDatabase(path, version: 2,
  onCreate: (db, v) async { await db.execute('CREATE TABLE orders(id TEXT PRIMARY KEY, total_cents INTEGER NOT NULL, note TEXT)'); },
  onUpgrade: (db, oldV, newV) async { if (oldV < 2) await db.execute('ALTER TABLE orders ADD COLUMN note TEXT'); });
```
   Each `if (oldV < N)` block is one step; never edit a shipped block. `onCreate` must produce the latest schema.
4. Use `?` placeholders (`rawQuery('... WHERE id = ?', [id])`), never string interpolation of input.
5. Do NOT delete the database file to resolve a migration error without user approval.

### Output
Database code and migrations.

### Quality Gate
- `dart run build_runner build --delete-conflicting-outputs` exits 0 (drift).
- `flutter analyze` reports no new issues.

---

## Phase 3: Host Tests

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. drift: open with `NativeDatabase.memory()` from `package:drift/native.dart`. Migration test: open a database at version 1 (use exported schemas from `drift_dev schema dump` and `schema generate`, or a v1 SQL fixture), then open `AppDb` at v2 and assert columns and rows.
2. sqflite runs on device only; in host tests use `sqflite_common_ffi`: `sqfliteFfiInit(); databaseFactory = databaseFactoryFfi;`, open with `inMemoryDatabasePath`. Create v1 with `version: 1` and the v1 `onCreate`, insert rows, close, reopen with the current `version` and callbacks, assert.
3. shared_preferences: `SharedPreferences.setMockInitialValues({})` (legacy API) or the platform test helpers in the package docs for the async API.
4. Run `flutter test test/data`.

### Output
`flutter_store`.

### Quality Gate
- `All tests passed!` with one migration test per version step.

---

## Worked Example

Illustrative only. `drift: ^2.20.0`, v1 shipped `orders(id, total_cents)`, v2 adds `note`.

Phase 2: `schemaVersion` 2, `if (from < 2) await m.addColumn(orders, orders.note);`, build_runner exit 0.

Phase 3:
```
$ flutter test test/data
00:02 +3: All tests passed!
```

---

## Exit Criteria

DONE when each data kind uses the right package, every schema step has an append-only migration with a host test, and generated code is current.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Conflicting outputs were detected` from build_runner | **Retry**: rerun with `--delete-conflicting-outputs`. |
| Phase 2 | `SqliteException(1): duplicate column name` | **Adjust**: the step ran twice; guard with `if (from < N)` and check `onCreate` builds the latest schema. |
| Phase 3 | `Bad state: databaseFactory not initialized` | **Adjust**: call `sqfliteFfiInit()` and set `databaseFactory` in `setUpAll`. |
| Phase 3 | `MissingPluginException` in tests | **Adjust**: a plugin needs a mock or FFI replacement on the host. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
