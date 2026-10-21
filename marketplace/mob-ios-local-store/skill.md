# iOS Local Persistence and Migration

**One-line description:** Chooses SwiftData, Core Data, UserDefaults or Keychain per data kind from the deployment target and what already exists, implements the store with a versioned schema and migration plan, sets file location, backup exclusion and Data Protection class so background tasks can still read it, and proves migration from a real v1 store fixture in XCTest.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `data_model` (object, required): Entities with fields and relationships, which data is secret, which is cache (re-downloadable), and the current schema version if a store already ships.

---

## Outputs

- `ios_store` (object): Store technology per data kind, model/schema file paths, migration plan, file protection class, test file path and results.

---

## Phase 1: Choose the Store per Data Kind

### Entry Criteria
- `app_profile.stack` is `ios` (or native iOS code in a cross-platform app).

### Actions
1. Apply per data kind:

| Data kind | Store |
|---|---|
| Tokens, passwords, keys | Keychain (`SecItemAdd`, `kSecClassGenericPassword`) |
| A few small settings (flags, last tab) | `UserDefaults` |
| Structured records, app already ships Core Data | Core Data (keep it; do not migrate frameworks inside a feature) |
| Structured records, new store, `ios_deployment_target` 17.0 or higher | SwiftData |
| Structured records, new store, target below 17.0 | Core Data (or GRDB if already in `app_profile`) |
| Large blobs (images, files) | Files in `Caches` (re-downloadable) or `Application Support` (user-created), with only the path in the DB |

2. Never put secrets in `UserDefaults`, a plist, or SwiftData/Core Data.
3. Keychain accessibility: if a background task reads the secret, use `kSecAttrAccessibleAfterFirstUnlock` (or `...ThisDeviceOnly` to exclude it from backups/migration); `kSecAttrAccessibleWhenUnlocked` fails while the device is locked.

### Output
Store decision table filled for this app.

### Quality Gate
- Every entity in `data_model` maps to exactly one store row.
- `grep -rn "UserDefaults" <feature dir> | grep -iE "token|password|secret"` prints nothing.

---

## Phase 2: Implement Schema and Migration

### Entry Criteria
- Phase 1 complete.

### Actions
1. SwiftData:
   - Define each version as `enum SchemaV1: VersionedSchema { static var versionIdentifier = Schema.Version(1, 0, 0); static var models: [any PersistentModel.Type] { [Order.self] } }` with `@Model` classes nested inside.
   - `enum OrdersMigrationPlan: SchemaMigrationPlan { static var schemas = [SchemaV1.self, SchemaV2.self]; static var stages = [MigrationStage.lightweight(fromVersion: SchemaV1.self, toVersion: SchemaV2.self)] }`. Use `.custom(fromVersion:toVersion:willMigrate:didMigrate:)` when data must be transformed (renaming with value change, splitting a field).
   - `ModelContainer(for: SchemaV2.Order.self, migrationPlan: OrdersMigrationPlan.self, configurations: ModelConfiguration(url: storeURL))`.
   - Background writes: a `@ModelActor actor OrdersStore`; `ModelContext` is not `Sendable`, never pass it across actors.
2. Core Data:
   - Add a new model version (Editor > Add Model Version), set it current, never edit the shipped version.
   - `NSPersistentContainer` store descriptions default `shouldMigrateStoreAutomatically = true` and `shouldInferMappingModelAutomatically = true` (lightweight). Add an explicit mapping model only when lightweight inference cannot express the change.
   - Use `container.performBackgroundTask` or `newBackgroundContext()` for writes; set `viewContext.automaticallyMergesChangesFromParent = true`.
   - Add launch argument `-com.apple.CoreData.ConcurrencyDebug 1` to the Debug scheme to crash on wrong-thread access.
3. Location and protection:
   - Store under `FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)`; create the directory if missing.
   - Cache-only stores: set `URLResourceValues.isExcludedFromBackup = true` on the file.
   - Data Protection: `NSFileProtectionComplete` makes the file unreadable while locked, which breaks background refresh. Use `completeUntilFirstUserAuthentication` (the system default for app files) unless the data requires `complete`; record the choice.
4. Do NOT delete the old store on migration failure as a "fix". That is data loss and needs the user's explicit approval.

### Output
Schema, container setup, protection settings.

### Quality Gate
- `app_profile.build_cmd` exits 0.
- For an existing shipped store, the previous model version file is unchanged: `git diff --stat -- '*.xcdatamodel*'` shows only the new version added (Core Data), or `SchemaV1` is unchanged in `git diff` (SwiftData).

---

## Phase 3: Migration and Store Tests

### Entry Criteria
- Phase 2 builds.

### Actions
1. Unit tests use an in-memory store: `ModelConfiguration(isStoredInMemoryOnly: true)` (SwiftData) or a store description with `url = URL(fileURLWithPath: "/dev/null")` (Core Data).
2. Migration test: create a v1 store fixture by running the previous app version (or the V1 schema in a test) and save it as a test resource (`orders-v1.store` plus `-wal`/`-shm` files if present). The test copies it to a temp directory, opens it with the current container and migration plan, and asserts row counts and transformed values.
3. Concurrency test: write 1,000 rows from the background actor while reading on main; assert final count. (1,000 is a test size, not a performance threshold.)
4. Run `xcodebuild test -scheme <S> -destination 'platform=iOS Simulator,name=<device>' -only-testing:<UnitTarget>/OrdersStoreTests`.

### Output
`ios_store`.

### Quality Gate
- `** TEST SUCCEEDED **`, including the migration test.
- The migration test opens a file fixture, not an in-memory store (`grep -n "orders-v1" OrdersStoreTests.swift` prints a match).

---

## Worked Example

Illustrative only. Target iOS 17.0, new store, entities `Order` and `LineItem`; auth token secret. v2 adds `Order.note: String?`.

Phase 1: token in Keychain with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`; orders in SwiftData.

Phase 2: `SchemaV1` and `SchemaV2`, lightweight stage; file protection `completeUntilFirstUserAuthentication` because a `BGAppRefreshTask` writes orders.

Phase 3:
```
Test Case '-[ShopTests.OrdersStoreTests test_migrate_v1_fixture_to_v2]' passed (0.231 seconds).
Executed 5 tests, with 0 failures
** TEST SUCCEEDED **
```

---

## Exit Criteria

DONE when each data kind sits in the right store, the schema is versioned with a migration plan, protection class matches background needs, and a v1 file fixture migrates in a passing test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Cannot use staged migration with an unknown model version` | **Adjust**: the shipped schema was edited in place; restore it from git and add a new version. |
| Phase 2 | Core Data `NSMigrationMissingSourceModelError` (134130) | **Adjust**: source model version missing from the bundle; restore it. |
| Phase 3 | Background refresh reads fail with file protection errors | **Adjust**: lower protection to `completeUntilFirstUserAuthentication` with the user's approval. |
| Phase 3 | Migration test passes on in-memory store only | **Retry**: use a real v1 file fixture. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
