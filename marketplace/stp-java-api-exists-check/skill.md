# Prove Each Java API Exists on the Compile Classpath and Release Level

**One-line description:** Checks every external Java class, method and constructor in the edit plan with `javap` against the exact dependency jar resolved by Maven or Gradle and against the project's `--release` level, so no invented method, wrong overload or JDK-too-new call reaches the code.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `edit_plan` (object[], required): From `stp-edit-plan-write`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `java_api_evidence` (object[]): `[{ "symbol": str, "status": "FOUND"|"NOT_FOUND"|"WRONG_SIGNATURE"|"VERSION_GATED"|"NOT_ON_CLASSPATH", "artifact": str, "version": str, "evidence": str, "command": str }]`.

---

## Phase 1: Resolve Each Class to a Jar or the JDK

### Entry Criteria
- `edit_plan` lists at least one external symbol, fully qualified (for example `java.text.Normalizer.normalize`, `org.apache.commons.lang3.StringUtils.stripAccents`).

### Actions
1. Read the release level: Maven `maven.compiler.release` (or `<release>` in `maven-compiler-plugin`), Gradle `java.toolchain.languageVersion` or `options.release`. Run `java -version` and `javac -version`.
2. JDK classes (`java.*`, `javax.*` shipped with the JDK): the source of truth is the JDK at the release level.
3. Library classes: find the dependency and its resolved version.
   - Maven: `./mvnw -q dependency:tree -Dincludes=<groupId>:<artifactId>` (for example `-Dincludes=org.apache.commons:commons-lang3`). Without `-q`, the tree prints under `[INFO]`.
   - Gradle: `./gradlew :<module>:dependencyInsight --dependency <artifactId> --configuration compileClasspath`.
   - No result: `NOT_ON_CLASSPATH`. Adding a dependency is out of scope.
4. Find the jar file:
   - Maven local repository: `~/.m2/repository/<groupId with / for .>/<artifactId>/<version>/<artifactId>-<version>.jar`.
   - Gradle cache: `~/.gradle/caches/modules-2/files-2.1/<groupId>/<artifactId>/<version>/<hash>/<artifactId>-<version>.jar` (find it with `rg --files -g "<artifactId>-<version>.jar" ~/.gradle/caches/modules-2/files-2.1/<groupId>`).

### Output
Jar path or JDK, version per symbol.

### Quality Gate
- Each library symbol has a resolved version printed by `dependency:tree` or `dependencyInsight`, and an existing jar path.

---

## Phase 2: Read Members with javap

### Entry Criteria
- Phase 1 done.

### Actions
1. Library class: `javap -cp <jar> -public <fully.qualified.Class>`. JDK class: `javap -public java.text.Normalizer` (javap reads the running JDK).
2. Read every overload of the method name. Compare with `new_text`:
   - parameter count and types (an `int` versus `long` or `CharSequence` versus `String` overload matters),
   - `static` or instance (calling an instance method on the class name does not compile),
   - return type (assigning `Optional<String>` to `String` does not compile),
   - checked exceptions after `throws` (your `new_text` must catch or declare them).
3. Nested types appear as `Outer$Inner`: `javap -cp <jar> -public 'java.text.Normalizer$Form'` lists enum constants (`NFD`, `NFC`, `NFKD`, `NFKC`).
4. Release gate for JDK APIs: the Javadoc for each method shows `@since` (for example `String.isBlank()` is since 11, `List.of` since 9, `String.strip()` since 11). If newer than the release level, mark `VERSION_GATED`. `javac --release <N>` enforces this at compile time, so the build would fail anyway; catching it here saves an edit cycle.
5. Generics: `javap` shows erased-and-generic signatures; with `-s` it also prints JVM descriptors. Use the generic form for compatibility checks.

### Output
Status and quoted member line per symbol.

### Quality Gate
- Each `FOUND` row quotes one `public ...` line from `javap` output whose parameter list matches the call in `new_text`.
- Each checked exception in the quoted line is handled in `new_text` or recorded as a plan gap.

---

## Phase 3: Report

### Entry Criteria
- All symbols checked.

### Actions
1. Emit `java_api_evidence`.
2. For non-`FOUND` rows, propose a verified alternative only after running `javap` on it.
3. Never take a method name from memory of a different library (Guava versus Commons versus Spring all have `StringUtils`-like helpers with different names). Only the `javap` output for the resolved jar counts.

### Output
`java_api_evidence`.

### Quality Gate
- Row count equals the number of distinct external symbols across `edit_plan`.

---

## Worked Example

Illustrative only.

Plan symbols: `java.text.Normalizer.normalize`, `java.text.Normalizer.Form.NFKD`, `org.apache.commons.lang3.StringUtils.stripAccents`. Release 17.

```
$ javap -public java.text.Normalizer
public final class java.text.Normalizer {
  public static java.lang.String normalize(java.lang.CharSequence, java.text.Normalizer$Form);
  public static boolean isNormalized(java.lang.CharSequence, java.text.Normalizer$Form);
}
$ ./mvnw -q dependency:tree -Dincludes=org.apache.commons:commons-lang3
(no output)
```

`normalize` FOUND (static, `CharSequence` plus `Form`, returns `String`); `Form.NFKD` FOUND via `javap -public 'java.text.Normalizer$Form'`; `StringUtils.stripAccents` NOT_ON_CLASSPATH because commons-lang3 is not a dependency, so the plan uses `Normalizer` instead.

---

## Exit Criteria

DONE when every external Java symbol has a status backed by a quoted `javap` member line from the resolved jar or the JDK, with release gates recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dependency not resolved | **Return**: `NOT_ON_CLASSPATH`; editing `pom.xml` or the Gradle file is out of scope. |
| Phase 1 | Jar not in the local cache | **Retry**: run `compile_one` from the card once (it downloads declared dependencies), then look again. |
| Phase 2 | `javap` prints "class not found" | **Adjust**: check the package name in the jar with `jar tf <jar> \| rg <ClassName>` (plain `|` in the shell). |
| Phase 2 | Method exists but only in a newer JDK | **Return**: `VERSION_GATED` with the `@since` value. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
