# Spring Boot Validated Configuration Properties

**One-line description:** Replaces scattered `@Value` and `System.getenv` reads in a Spring Boot 3 app with immutable `@ConfigurationProperties` records annotated `@Validated` and Jakarta Bean Validation constraints, maps them to environment variables through relaxed binding, imports mounted secrets with `configtree:`, and proves the context fails to start on missing values without the actuator or logs exposing them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`.
- `layering_spec` (object, required): Layer order from `cfg-env-layering-precedence`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `config_schema_module` (string): Path of the properties record(s) created, for example `src/main/java/com/acme/billing/config/AppProperties.java`.
- `startup_validation_command` (string): A command that starts the app with an empty environment and must exit non-zero with a binding failure, plus the expected message text.

---

## Phase 1: Write The Properties Record

### Entry Criteria
- Spring Boot 3.x (check `spring-boot` version in `pom.xml` or `build.gradle`). For Boot 2.x, records and constructor binding differ; see Error Handling.
- `spring-boot-starter-validation` is a dependency. Without it, `@Validated` constraints are silently not enforced. Check with `./mvnw dependency:tree | grep starter-validation` or `./gradlew dependencies --configuration runtimeClasspath | grep starter-validation`.

### Actions
1. Choose one prefix, for example `app`. Create `AppProperties.java`. Edit only this file and the main application class in this phase.
2. Map `config_keys` rows:

| `type` / `class` | Record component |
|---|---|
| secret | `@NotBlank String dbPassword` |
| url | `@NotNull URI apiBase` |
| int (port) | `@Min(1) @Max(65535) int port` (TCP range) |
| bool | `boolean featureX` |
| duration | `@NotNull Duration timeout` (accepts `30s`, `PT30S`) |
| enum | a Java `enum` type; binding rejects unknown values |
| nested group | a nested record annotated `@Valid` |

3. Write it:
```java
@Validated
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @NotBlank String dbPassword,
        @NotNull URI apiBase,
        @DefaultValue("8080") @Min(1) @Max(65535) int port,
        @DefaultValue("30s") Duration timeout) {

    @Override
    public String toString() {
        return "AppProperties[dbPassword=****, apiBase=" + apiBase + ", port=" + port + ", timeout=" + timeout + "]";
    }
}
```
   Records generate a `toString` that prints every component, including secrets. Override it as shown.
4. Register it: add `@ConfigurationPropertiesScan` to the `@SpringBootApplication` class, or `@EnableConfigurationProperties(AppProperties.class)`.
5. Relaxed binding maps environment variables to properties: `APP_DBPASSWORD` binds `app.db-password`/`app.dbPassword` (remove dashes, replace dots with underscores, uppercase). List the exact variable name per field in a comment and in the deploy manifests. Check the Spring Boot reference "Binding From Environment Variables" for list and map forms.

### Output
`AppProperties` record registered with the context.

### Quality Gate
- `./mvnw -q compile` or `./gradlew compileJava` exits 0.
- Component count equals the count of `config_keys` rows with class `secret` or `deploy-config` under this prefix.

---

## Phase 2: Wire Layers And Remove Direct Reads

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Base and profile files implement layers 2 and 3: `application.yml` and `application-<profile>.yml`, activated with `SPRING_PROFILES_ACTIVE`. Put no secrets in them.
2. Mounted secret files (Kubernetes Secret volumes, Docker secrets) are imported with a config tree. In `application.yml`: `spring.config.import: "optional:configtree:/run/secrets/"`. Each file name becomes a property name (`app.db-password` from a file named `app.db-password`). Use `optional:` only if the secret may also come from an environment variable; the record's `@NotBlank` still enforces presence.
3. Local development (layer 4) imports a dotenv-style file only in the dev profile: in `application-dev.yml` set `spring.config.import: "optional:file:.env[.properties]"`.
4. Replace each `@Value("${...}")` and `System.getenv(...)` site from the inventory with constructor injection of `AppProperties`. One class at a time; run tests between changes.
5. Lock the actuator: in Spring Boot 3, `/actuator/env` and `/actuator/configprops` mask values by default (`management.endpoint.env.show-values` defaults to `never`). Confirm it is not set to `always` anywhere: `rg -n 'show-values' src/main/resources`.

### Output
All config flows through `AppProperties`.

### Quality Gate
- `rg -n -e '@Value\("\$\{' -e 'System\.getenv\(' src/main` returns nothing (or documented exceptions).
- `rg -n 'show-values:\s*always' src/main/resources` returns nothing.
- `./mvnw -q test` or `./gradlew test` exits 0.

---

## Phase 3: Prove Startup Failure And Masking

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Build and run with an empty environment: `./mvnw -q package -DskipTests && env -i PATH="$PATH" JAVA_HOME="$JAVA_HOME" java -jar target/*.jar; echo "exit=$?"`. Expected: `APPLICATION FAILED TO START`, a `Description:` block containing `Binding to target ... AppProperties failed`, `Property: app.dbPassword` (or `app.db-password`), `Reason: must not be blank`, and `exit=1`. Record the exact `Reason:` line in `startup_validation_command`.
   Here `-DskipTests` only speeds up packaging; the test suite runs in step 3.
2. Add a context-runner test (fast, no server):
```java
private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withUserConfiguration(TestConfig.class); // @EnableConfigurationProperties(AppProperties.class)

@Test
void failsWhenSecretMissing() {
    runner.withPropertyValues("app.api-base=https://api.example.com")
          .run(ctx -> assertThat(ctx).hasFailed());
}

@Test
void toStringMasksSecret() {
    var p = new AppProperties("FAKE-SECRET-123", URI.create("https://x"), 8080, Duration.ofSeconds(30));
    assertThat(p.toString()).doesNotContain("FAKE-SECRET-123");
}
```
   `ApplicationContextRunner` needs `ValidationAutoConfiguration` for constraints: add `.withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))`.
3. Run the tests and record the result lines.

### Output
`config_schema_module`, `startup_validation_command`.

### Quality Gate
- The empty-environment start prints `APPLICATION FAILED TO START` and `exit=1`.
- Deleting the `toString` override makes `toStringMasksSecret` fail (mutation check; restore afterwards).

---

## Common Mistakes To Avoid

- Do not forget `spring-boot-starter-validation`; without it `@Validated` does nothing and the app starts with a blank password.
- Do not use `@Value` with a default for a secret (`${app.db-password:changeme}`).
- Do not set `management.endpoints.web.exposure.include=*` in production; it exposes `env`, `configprops` and `heapdump`. A heap dump contains secrets in memory regardless of masking.
- Do not log the properties object before checking its `toString`.

---

## Worked Example

Illustrative. Billing service, Boot 3.3, keys `APP_DBPASSWORD` (secret via `/run/secrets`), `APP_APIBASE`, `APP_PORT`.

Phase 2: `spring.config.import: "optional:configtree:/run/secrets/"`; `rg '@Value\("\$\{' src/main` returns 0 hits after 4 classes were migrated.

Phase 3:
```
$ env -i PATH="$PATH" JAVA_HOME="$JAVA_HOME" java -jar target/billing.jar; echo "exit=$?"
***************************
APPLICATION FAILED TO START
***************************
Description:
Binding to target com.acme.billing.config.AppProperties failed:
    Property: app.dbPassword
    Value: "null"
    Reason: must not be blank
exit=1
```

---

## Exit Criteria

DONE when every key binds through a validated record, direct reads are gone, the actuator masks values, the empty-environment start fails with a binding error naming the property, and the masking test fails under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Spring Boot 2.x | **Adjust**: use a class with `@ConstructorBinding` (2.2 to 2.7) or getters and setters with `@Validated`; records need Boot 2.6+ with `@ConstructorBinding`. |
| Phase 1 | Kotlin project | **Adjust**: use a `data class` with `@ConfigurationProperties`; override `toString` the same way. |
| Phase 2 | Environment variable does not bind | **Retry**: check the relaxed binding name with `/actuator/configprops` in a dev profile or by logging `Environment.getProperty("app.db-password") != null`. |
| Phase 3 | The app starts despite the missing secret | **Stop**: validation is not active; confirm the starter dependency and `@Validated`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
