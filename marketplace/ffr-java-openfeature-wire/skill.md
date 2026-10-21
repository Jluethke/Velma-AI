# Java OpenFeature SDK Wiring

**One-line description:** Adds `dev.openfeature:sdk` and the chosen provider to one Java service built with Maven or Gradle, sets the provider once with `OpenFeatureAPI.getInstance().setProviderAndWait`, and replaces one code decision with a typed evaluation that passes the safe default and an `ImmutableContext` targeting key.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flag_spec` (object, required): Output of `ffr-flag-type-classify`.
- `provider_choice` (object, required): Output of `ffr-provider-select`.
- `flagd_config` (object, optional): Output of `ffr-flagd-local-setup` when the provider is flagd.
- `unleash_config` (object, optional): Output of `ffr-unleash-setup` when the provider is Unleash.
- `launchdarkly_config` (object, optional): Output of `ffr-launchdarkly-setup` when the provider is LaunchDarkly.
- `repo_path` (string, required): Root of the Java project (with `pom.xml` or `build.gradle(.kts)`).

---

## Outputs

- `java_flag_wiring` (object): Dependencies and versions added, the class that sets the provider, every call site with its default, and the build and test results.

---

## Phase 1: Add Dependencies and Set the Provider

### Entry Criteria
- The provider config matching `provider_choice.provider` is present.

### Actions
1. Look up the current release of `dev.openfeature:sdk` and the provider artifact (flagd: `dev.openfeature.contrib.providers:flagd`; LaunchDarkly: `com.launchdarkly:launchdarkly-openfeature-serverprovider`) on Maven Central. Write the exact versions; do not use `LATEST` or `+`.
2. Maven:
```xml
<dependency>
  <groupId>dev.openfeature</groupId>
  <artifactId>sdk</artifactId>
  <version>X.Y.Z</version>
</dependency>
```
Gradle: `implementation("dev.openfeature:sdk:X.Y.Z")`.
3. Set the provider once. In Spring Boot, use a `@Configuration` class with a bean that runs at startup; in plain Java, in `main`:
```java
OpenFeatureAPI api = OpenFeatureAPI.getInstance();
FlagdProvider provider = new FlagdProvider(
    FlagdOptions.builder().host(System.getenv().getOrDefault("FLAGD_HOST", "localhost")).port(8013).build());
try {
    api.setProviderAndWait(provider);
} catch (Exception e) {
    log.warn("flag provider not ready, serving defaults", e);
}
```
4. Register `api.shutdown()` on application shutdown (`@PreDestroy` or a JVM shutdown hook).
5. In Spring, expose `Client` as a bean (`api.getClient()`) and inject it. Do not call `setProvider` inside request handlers.

### Output
Provider set once.

### Quality Gate
- `mvn -q -DskipTests compile` or `./gradlew compileJava` exits 0.
- `rg -n "setProvider(AndWait)?\(" src/main` returns exactly one line.

---

## Phase 2: Replace One Decision with a Flag Evaluation

### Entry Criteria
- Provider set.

### Actions
1. Create `Flags.java`:
```java
public final class Flags {
    public static final String CHECKOUT_NEW_TAX_ENGINE = "checkout-new-tax-engine";
    public static final boolean CHECKOUT_NEW_TAX_ENGINE_DEFAULT = false;
    private Flags() {}
}
```
2. At the decision point:
```java
EvaluationContext ctx = new ImmutableContext(
    String.valueOf(user.getId()),
    Map.of("country", new Value(user.getCountry()), "plan", new Value(user.getPlan())));
boolean useV2 = client.getBooleanValue(Flags.CHECKOUT_NEW_TAX_ENGINE, Flags.CHECKOUT_NEW_TAX_ENGINE_DEFAULT, ctx);
Money total = useV2 ? taxEngineV2.compute(cart) : taxEngineV1.compute(cart);
```
3. `Map.of` rejects null values with a `NullPointerException`. If an attribute can be null, leave it out of the map rather than passing null.
4. Use the method matching `flag_spec.value_type`: `getBooleanValue`, `getStringValue`, `getIntegerValue`, `getDoubleValue`, `getObjectValue`.
5. The SDK does not throw on evaluation errors; it returns the default. Do not wrap the call in a try/catch that rethrows.
6. One call site at a time; keep the old path.

### Output
One call site using the flag.

### Quality Gate
- `rg -n "\"checkout-new-tax-engine\"" src/main` returns only `Flags.java`.
- Every `getBooleanValue` call in changed files passes a `Flags.*_DEFAULT` constant.

---

## Phase 3: Build and Test

### Entry Criteria
- Call site changed.

### Actions
1. Run `mvn -q verify` or `./gradlew test`.
2. Tests must not need a running flag service; `ffr-both-paths-test` adds the `InMemoryProvider` fixture. Do not add `@Disabled` or delete a test to get green.

### Output
`java_flag_wiring`.

### Quality Gate
- The build exits 0 and the Surefire or Gradle summary line (for example `Tests run: 214, Failures: 0, Errors: 0, Skipped: 0`) is recorded.
- `git diff` adds no `@Disabled` and deletes no test file.

---

## Worked Example

Illustrative only.

```
$ ./gradlew compileJava
BUILD SUCCESSFUL in 6s
$ rg -n "setProvider(AndWait)?\(" src/main
src/main/java/com/shop/config/FeatureFlagConfig.java:27:            api.setProviderAndWait(provider);
$ ./gradlew test
BUILD SUCCESSFUL in 41s
214 tests completed, 0 failed
```

---

## Exit Criteria

DONE when exact dependency versions are pinned, the provider is set once at startup, one decision uses a typed evaluation with the shared default and an `ImmutableContext`, and the build and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dependency conflict (gRPC or protobuf versions) | **Adjust**: run `mvn dependency:tree` or `./gradlew dependencies`, align versions through the BOM the project already uses. |
| Phase 1 | Class not found for the provider | **Adjust**: read the provider README for the package name; do not guess. |
| Phase 2 | NullPointerException building the context | **Adjust**: drop null attributes from the map. |
| Phase 3 | Tests try to connect to flagd | **Adjust**: set `InMemoryProvider` in a test configuration before the application context starts. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
