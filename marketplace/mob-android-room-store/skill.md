# Android Room Store and Migration

**One-line description:** Implements local persistence on Android with Room entities and DAOs returning `Flow`, exported schema JSON checked into git, `AutoMigration` or hand-written `Migration` per version step (never destructive fallback without approval), Preferences DataStore for settings, and `MigrationTestHelper` instrumented tests that migrate a real old schema.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_profile` (object, required): From `mob-app-profile`.
- `data_model` (object, required): Entities, fields, relationships, secret vs cache data, and the currently shipped database version if any.

---

## Outputs

- `android_store` (object): Store per data kind, entity/DAO/database file paths, schema directory, migration list, test results.

---

## Phase 1: Choose Stores and Enable Schema Export

### Entry Criteria
- `app_profile.stack` is `android` (or native Android code in a cross-platform app).

### Actions
1. Per data kind:

| Data kind | Store |
|---|---|
| Structured records, queries | Room |
| Small settings | Preferences DataStore (`androidx.datastore:datastore-preferences`); keep existing `SharedPreferences` only if already used and migrate with `SharedPreferencesMigration` when touching it |
| Secrets (tokens, keys) | Encrypt with a key held in Android Keystore (`KeyGenParameterSpec`) before storing. Jetpack `security-crypto` (`EncryptedSharedPreferences`) is deprecated; check its release notes before adding it |
| Large files | `context.filesDir` (user data) or `cacheDir` (re-downloadable), path stored in Room |

2. Turn on schema export so every version is diffable. Room 2.6+ Gradle plugin:
```kotlin
plugins { id("androidx.room") }
room { schemaDirectory("$projectDir/schemas") }
```
   Older setup with KSP: `ksp { arg("room.schemaLocation", "$projectDir/schemas") }`. Set `exportSchema = true` in `@Database`.
3. Build once: `./gradlew :app:kspDebugKotlin` (or `kaptDebugKotlin` if the project uses kapt). Confirm `app/schemas/<fully.qualified.AppDatabase>/<version>.json` exists and commit it.

### Output
Store decisions and schema export.

### Quality Gate
- `ls app/schemas/*/` lists a JSON file for the current version and every previously shipped version.
- `grep -rn "getSharedPreferences" app/src/main | grep -iE "token|secret|password"` prints nothing.

---

## Phase 2: Entities, DAOs and Migrations

### Entry Criteria
- Phase 1 complete.

### Actions
1. DAO rules: reads return `Flow<List<T>>` (observable, the UI's source of truth); writes are `suspend fun`. Upserts use `@Upsert` (Room 2.5+). Multi-step writes use `@Transaction` or `db.withTransaction { }`.
2. Never call a DAO on the main thread; Room throws `IllegalStateException: Cannot access database on the main thread`. Do NOT use `allowMainThreadQueries()` outside tests.
3. Bump `version` by 1 per shipped change. For each step choose:

| Change | Migration |
|---|---|
| Add table, add nullable column, add column with `@ColumnInfo(defaultValue = ...)` | `@Database(autoMigrations = [AutoMigration(from = 1, to = 2)])` |
| Rename or delete a column/table | `AutoMigration(from, to, spec = V2Spec::class)` with `@RenameColumn`/`@DeleteColumn`/`@RenameTable`/`@DeleteTable` on the spec |
| Type change, data transform, split/merge | `val MIGRATION_2_3 = object : Migration(2, 3) { override fun migrate(db: SupportSQLiteDatabase) { db.execSQL("...") } }` added via `.addMigrations(MIGRATION_2_3)` |

4. Do NOT add `fallbackToDestructiveMigration()` to make a crash go away. It deletes user data. Only with the user's written approval, and then only for data marked cache in `data_model`.
5. Do not edit an older schema JSON by hand; it is the record of what shipped.

### Output
Entities, DAOs, database class, migrations.

### Quality Gate
- `./gradlew :app:assembleDebug` exits 0 and a new `<version>.json` appears in `app/schemas`.
- `grep -rn "fallbackToDestructiveMigration\|allowMainThreadQueries" app/src/main` prints nothing (or an approval note is recorded).

---

## Phase 3: Migration and DAO Tests

### Entry Criteria
- Phase 2 builds.

### Actions
1. Make schemas visible to instrumented tests: `android { sourceSets { getByName("androidTest").assets.srcDir("$projectDir/schemas") } }` (the Room Gradle plugin configures this for you; check before adding).
2. Migration test with `androidx.room:room-testing`:
```kotlin
@get:Rule val helper = MigrationTestHelper(InstrumentationRegistry.getInstrumentation(), AppDatabase::class.java)
@Test fun migrate1To2() {
    helper.createDatabase("t", 1).apply { execSQL("INSERT INTO orders (id, total) VALUES ('a', 100)"); close() }
    val db = helper.runMigrationsAndValidate("t", 2, true, MIGRATION_1_2)
    db.query("SELECT note FROM orders WHERE id='a'").use { assertTrue(it.moveToFirst()) }
}
```
   Add one test that migrates from the oldest shipped version to the latest in one run.
3. DAO tests with `Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)`; read `Flow` with `first()` inside `runTest`.
4. Run only these: `./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.example.data.MigrationTest`.

### Output
`android_store`.

### Quality Gate
- Gradle prints `BUILD SUCCESSFUL`; `app/build/outputs/androidTest-results/connected/` XML shows `failures="0"`.
- A test exists for every version step plus oldest-to-latest (`grep -c "runMigrationsAndValidate" MigrationTest.kt` is at least the step count plus one).

---

## Worked Example

Illustrative only. Shipped DB version 1 (`orders`), v2 adds `note TEXT` nullable, v3 converts `total` from REAL to INTEGER cents.

Phase 2: 1 to 2 via `AutoMigration(from = 1, to = 2)`; 2 to 3 via `MIGRATION_2_3` creating `orders_new`, copying `CAST(ROUND(total * 100) AS INTEGER)`, dropping and renaming.

Phase 3:
```
$ ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.shop.data.MigrationTest
Starting 3 tests on Pixel_7_API_34(AVD) - 14
Finished 3 tests on Pixel_7_API_34(AVD) - 14
BUILD SUCCESSFUL in 1m 4s
```

---

## Exit Criteria

DONE when every version has a committed schema JSON, every step has a migration with a test, no destructive fallback exists without approval, and DAO and migration tests pass on a device or emulator.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Schema JSON not generated | **Adjust**: `exportSchema` false or schema location not set; fix and rebuild. |
| Phase 2 | `Room cannot verify the data integrity... changed schema but forgot to update the version number` | **Adjust**: bump `version` and add the migration. |
| Phase 2 | `AutoMigration ... ambiguous rename` compile error | **Adjust**: add the spec with `@RenameColumn`. |
| Phase 3 | `Migration didn't properly handle: orders` with expected/found dump | **Adjust**: compare the two table descriptions in the message; fix column types, nullability or defaults in the SQL. |
| Phase 3 | `Cannot find the schema file in the assets folder` | **Adjust**: add the schemas dir to androidTest assets. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
