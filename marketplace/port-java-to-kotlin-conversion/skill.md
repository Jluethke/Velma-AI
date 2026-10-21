# Port Java to Kotlin Conversion

**One-line description:** Plans a class-at-a-time Java to Kotlin conversion in a mixed-source build: Gradle or Maven setup so both languages compile together, IntelliJ's Java-to-Kotlin converter output cleanup (platform types, `!!`, statics, `@JvmOverloads`, `@Throws`), and the conversions that silently change behavior (`==` meaning, data class `toString`, final-by-default classes with Spring and Mockito, Lombok, eager collection operations).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the Java repository at the reference commit, converted in place on a branch.
- `dependency_map` (object[], required): Output of `port-dependency-equivalence-map`.

---

## Outputs

- `kotlin_conversion_plan` (object): `build_changes` (exact Gradle or Maven edits), `compiler_plugins` (all-open, Spring, JPA no-arg as needed), `cleanup_rules` (one row per converter artifact or behavior trap, with a grep to find it), and `per_class_procedure`.

---

## Phase 1: Mixed Build

### Entry Criteria
- `git status --porcelain` empty; `./gradlew build` or `mvn verify` passes.

### Actions
1. Gradle (Kotlin DSL): add `kotlin("jvm") version "<version>"` to `plugins`. Set the JVM target to the project's Java release: `kotlin { jvmToolchain(<N>) }`. Kotlin sources may live in `src/main/kotlin` or beside Java in `src/main/java`; the Kotlin compiler reads Java sources for references, then javac compiles Java against Kotlin output.
2. Maven: add `kotlin-maven-plugin` with `compile` and `test-compile` executions whose `sourceDirs` include both `src/main/kotlin` and `src/main/java`, and reconfigure `maven-compiler-plugin` so its `default-compile` and `default-testCompile` executions are disabled (`<phase>none</phase>`) and new `java-compile` and `java-test-compile` executions run after Kotlin. Follow the "Compile Kotlin and Java sources" section of the Kotlin Maven docs exactly; the order matters.
3. Add compiler plugins when the dependency map shows the framework:

| Framework | Plugin | Why |
|---|---|---|
| Spring (`@Component`, `@Configuration`, `@Transactional`) | `kotlin("plugin.spring")` | Kotlin classes are final; Spring proxies need open classes and methods |
| JPA or Hibernate entities | `kotlin("plugin.jpa")` | generates no-arg constructors |
| Mockito mocking concrete classes | Mockito 5 (inline mock maker is the default) or `mockito-inline` on Mockito 4 | final classes cannot be mocked by the subclass mock maker |
| Lombok | delombok the class before converting (`lombok.jar delombok` or the `io.freefair.lombok` Gradle plugin's `delombok` task) | the converter does not see generated getters, builders, or `@Slf4j` loggers |

4. Run the full build and tests with zero Kotlin files: must pass.

### Output
`build_changes`, `compiler_plugins`.

### Quality Gate
- `./gradlew build` (or `mvn verify`) passes after the build changes with no source file changed.
- One trivial Kotlin file (`object Probe { const val X = 1 }`) referenced from Java compiles, proving Java-to-Kotlin calls work; it is deleted afterward.

---

## Phase 2: Cleanup Rules

### Entry Criteria
- Mixed build works.

### Actions
1. Record these rules with their greps; every converted class is checked against all of them.

| Converter output or trap | Find it | Rule |
|---|---|---|
| `!!` added by the converter | `rg -n "!!" src/main` | replace each with a real nullability decision: annotate the Java dependency (`@Nullable`/`@NonNull` from JetBrains, JSR-305, Jakarta, or Checker Framework are honored by Kotlin) or handle `null`. Keep a `!!` only with a comment naming why null is impossible |
| Platform types (`String!`) leaking from Java APIs | IntelliJ shows them on hover; `rg -n "= .*\.get[A-Z]\w*\(\)$" src/main/kotlin` finds untyped assignments | declare the type explicitly (`val name: String? = javaObj.getName()`) |
| `static` members | `companion object` in output | Java callers need `@JvmStatic` on functions and `@JvmField` or `const val` on fields, or their call syntax breaks (`Foo.Companion.bar()`) |
| Overloaded Java methods merged into default parameters | `rg -n "fun \w+\(.*=.*\)" src/main/kotlin` | add `@JvmOverloads` when Java code calls the function |
| Checked exceptions | `rg -n "throws " ` on the Java original | add `@Throws(IOException::class)` when Java callers catch that exception, or javac rejects their `catch` block |
| `==` on objects | `rg -n " == | != " src/main/kotlin` | Kotlin `==` calls `equals`; Java `==` compared references. If the Java code compared references on purpose (identity maps, sentinel objects, enum-like singletons), use `===`. Java code comparing boxed `Integer` with `==` worked only in the cached range -128..127; the Kotlin version now compares values, which changes behavior for other values |
| Class converted to `data class` | `rg -n "data class" src/main/kotlin` | the converter does not do this by default; if a person does, `toString` output becomes `Point(x=1, y=2)` and `equals`, `hashCode`, `copy`, `componentN` appear. Only allowed when golden records do not include the old `toString` text |
| `switch` with fall-through | `rg -n "case .*:$" -A1` on the original | `when` has no fall-through; combine labels with commas |
| Streams converted to collection operations | `rg -n "\.stream\(\)" ` on the original | Kotlin `map`/`filter` on collections are eager and build intermediate lists; side effects run in a different order than lazy streams. Use `asSequence()` when the stream relied on laziness or short-circuiting |
| `String.format` | `rg -n "\.format\(" src/main/kotlin` | uses the default locale like Java; keep the original call's locale argument, add `Locale.ROOT` only if the original passed it |
| Integer widening | compile errors like "Type mismatch: inferred type is Int but Long was expected" | add `.toLong()`; Kotlin has no implicit widening |
| `char` arithmetic | `rg -n "'.' *[-+]" src/main/kotlin` | `c - 'a'` is `Int`; `c + 1` is `Char`; check the type matches the Java expression |
| SAM interfaces | Java functional interfaces used from Kotlin | Kotlin interfaces need `fun interface` to accept lambdas |
| `Object.wait/notify`, `synchronized` blocks | `rg -n "synchronized|wait\(|notify" ` on the original | `synchronized(lock) { }` is a stdlib function; `wait`/`notify` need `(lock as Object).wait()`; prefer keeping such classes in Java |

### Output
`cleanup_rules`.

### Quality Gate
- Every rule has a grep or a compiler message to find it.

---

## Phase 3: Per-Class Procedure

### Entry Criteria
- Rules written.

### Actions
1. Write `per_class_procedure`, one class per commit in `port-file-order-plan` order (leaf classes first, so converted Kotlin is called by Java, not the other way):
   1. In IntelliJ IDEA: open the `.java` file, then Code, Convert Java File to Kotlin File (default shortcut Ctrl+Alt+Shift+K on Windows and Linux, Cmd+Alt+Shift+K on macOS). If the commit dialog offers an extra commit for the `.java` to `.kt` rename, accept it so history follows the file.
   2. Apply every rule in `cleanup_rules`; run each grep on the new file.
   3. Do not convert the class's tests in the same commit. The existing Java JUnit tests run against the Kotlin class unchanged; that is the parity check.
   4. Build and test: `./gradlew build` (or `mvn verify`), then the Kotlin golden replay for the class's behaviors.
   5. Commit ("convert Foo to Kotlin").
2. Forbidden shortcuts, each checkable:
   - Editing a Java test to make it pass after conversion: `git diff --stat HEAD~1 -- src/test` prints nothing in a conversion commit.
   - `@Suppress` added to silence warnings: `rg -n "@Suppress" src/main/kotlin` count does not increase without a reason comment.
   - `lateinit` added to dodge a nullability decision on a field that can be null at read time.

### Output
`kotlin_conversion_plan`.

### Quality Gate
- The procedure includes the exact build command and the golden replay command.
- Every forbidden shortcut has a check command.

---

## Worked Example

Illustrative. Spring Boot service, Gradle, 120 Java classes.

Phase 1 adds `kotlin("jvm")` and `kotlin("plugin.spring")`; `./gradlew build` passes with zero Kotlin files.

Phase 3 converting `PriceRule.java`:
```
$ rg -n "!!" src/main/kotlin/com/acme/PriceRule.kt
14:        val tier = customer.tier!!
```
`Customer.getTier()` in Java has no annotation; the database column is nullable. Decision: `val tier = customer.tier ?: return BASE_PRICE`, which is what the Java code did via a later `if (tier == null)` check. Java original at line 31 compared `Integer` objects with `==`:
```java
if (rule.getMinQty() == order.getQty()) { ... }
```
Golden record B-021/0007 has quantity 200, outside the Integer cache: Java returned "no match". The Kotlin `==` returns "match". Recorded as a source defect; the user decided to keep the Java result for parity with `===` plus a TODO, then fix in a separate tested change.
```
$ ./gradlew test --tests "com.acme.PriceRuleTest" --tests "golden.KotlinGoldenTest"
BUILD SUCCESSFUL
```

---

## Exit Criteria

DONE when the mixed build compiles and tests pass with no Kotlin, framework plugins are set, cleanup rules have checks, and the per-class procedure keeps Java tests unchanged as the parity check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Maven compiles Java before Kotlin and fails on Kotlin references | **Adjust**: recheck the execution order against the Kotlin Maven docs; `default-compile` must be disabled. |
| Phase 1 | Annotation processors (MapStruct, Dagger) used on classes to convert | **Adjust**: add `kotlin("kapt")` or check whether the processor supports KSP; or keep those classes in Java. |
| Phase 3 | Converter output does not compile | **Adjust**: fix by hand following the rules; do not revert to editing the Java to suit the converter. |
| Phase 3 | A Java test fails after conversion | **Stop**: the conversion changed behavior; find the rule that applies; never edit the test in the conversion commit. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
