# Spring Boot Major Upgrade (2.7 To 3.x)

**One-line description:** Upgrades Spring Boot 2.7 to 3.x per the Spring Boot 3.0 Migration Guide: reach the latest 2.7.x and Java 17 first, run the OpenRewrite `UpgradeSpringBoot_3_0` recipe for `javax` to `jakarta` and API moves, use `spring-boot-properties-migrator` to find renamed properties, and rewrite Spring Security configuration that the recipe cannot finish.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager` (`maven` or `gradle`), `runtime_version`, `build_command`, `test_command`, `work_dir`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`. The Spring Boot `framework-flow` item and its blockers.
- `codemod_log` (object[], required): From `dup-codemod-run`. Confirms earlier library migrations landed.
- `framework_target_version` (string, required): For example `3.3` or an exact `3.3.4`. For a 3.x to 4.x move, read the Spring Boot 4.0 Migration Guide on the project wiki and apply this same phase structure with its recipe.

---

## Outputs

- `framework_upgrade_log` (object): `from`, `to`, `java_version`, `steps` (each with commit and test result), `renamed_properties`, `security_rewrites`, `final_test_result`. Also written to `<work_dir>/framework-spring.json`.

---

## Phase 1: Preconditions On 2.7

### Entry Criteria
- `upgrade_scope.framework == "spring-boot"`; Boot version 2.x (`./mvnw help:evaluate -Dexpression=project.parent.version -q -DforceStdout` for starter-parent projects, or the plugin version in Gradle).

### Actions
1. Move to the latest 2.7.x patch first (its own `bump` commit). The migration guide recommends starting from the latest 2.7.x so deprecations are visible.
2. Java 17 is the minimum for Boot 3. Check `java -version` and the build's `java.version` / `maven.compiler.release` / Gradle `toolchain.languageVersion`. If below 17, upgrade the JDK first in its own commit (build config plus CI image), tests green.
3. Compile with deprecation output (`-Xlint:deprecation`) and fix uses of APIs deprecated in 2.x; Boot 3 removed the ones deprecated in 2.x.
4. Third-party starters: each must have a release built for Jakarta EE 9+/Boot 3 (look for "Spring Boot 3" or "jakarta" in its release notes). Record blockers.

### Output
2.7.latest on Java 17, blocker list.

### Quality Gate
- `./mvnw -B verify` (or `./gradlew check`) passes on 2.7.latest with Java 17, test failures equal baseline.
- Every starter has a recorded Boot 3 compatible version or is a blocker.

---

## Phase 2: OpenRewrite Migration

### Entry Criteria
- Blockers resolved; tree clean.

### Actions
1. Dry run (Maven): `./mvnw -U org.openrewrite.maven:rewrite-maven-plugin:dryRun -Drewrite.recipeArtifactCoordinates=org.openrewrite.recipe:rewrite-spring:RELEASE -Drewrite.activeRecipes=org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0`. Review `target/rewrite/rewrite.patch`. For a later 3.x target use the matching recipe (for example `UpgradeSpringBoot_3_3`); confirm the recipe name in the OpenRewrite recipe catalog before running.
2. Gradle: apply the `org.openrewrite.rewrite` plugin with `rewrite { activeRecipe(...) }` and the `rewrite-spring` dependency (ask before changing the build file), then `./gradlew rewriteDryRun` and `./gradlew rewriteRun`.
3. Apply: same command with goal `run`. The recipe changes the Boot version, `javax.*` imports to `jakarta.*` (servlet, persistence, validation, annotation), moved properties, and many deprecated API calls.
4. Format and commit as automated: `refactor: OpenRewrite UpgradeSpringBoot_3_0`.
5. Check leftovers: `git grep -nE 'import javax\.(servlet|persistence|validation|annotation\.(PostConstruct|PreDestroy)|transaction)'` must print nothing (note `javax.sql` and `javax.crypto` are part of the JDK and stay).

### Output
Automated migration commit.

### Quality Gate
- The jakarta leftover grep prints nothing.
- The project compiles: `./mvnw -B -DskipTests compile` exit 0 (tests run in Phase 3).

---

## Phase 3: Properties, Security, Behavior

### Entry Criteria
- Compiles on Boot 3.

### Actions
1. Add `org.springframework.boot:spring-boot-properties-migrator` with `runtime` scope temporarily. Start the app (or run the context-loading test); it logs renamed and removed properties at startup. Fix each in `application.yml` / `application.properties` (for example `spring.redis.*` became `spring.data.redis.*`). Remove the migrator dependency afterward. Commit both changes.
2. Spring Security 6: `WebSecurityConfigurerAdapter` is removed. Convert to a `@Bean SecurityFilterChain filterChain(HttpSecurity http)`. `authorizeRequests()` becomes `authorizeHttpRequests()`; `antMatchers`/`mvcMatchers` become `requestMatchers`. One commit; run security tests.
3. Behavior changes to check with tests (from the migration guide): trailing slash matching is no longer enabled by default in Spring MVC and WebFlux (`/users/` no longer matches `/users`); Hibernate 6 changes (for example sequence and ID generation defaults); Spring Cloud Sleuth replaced by Micrometer Tracing; `HttpStatus` replaced by `HttpStatusCode` in some APIs. Add a test for each one that touches this app before changing code to restore old behavior.
4. Run the full build: `./mvnw -B verify`. Test failures must equal the baseline. Write `<work_dir>/framework-spring.json`.

### Output
`framework_upgrade_log`.

### Quality Gate
- The properties migrator was removed: `git grep -n 'spring-boot-properties-migrator'` prints nothing.
- `git grep -n 'WebSecurityConfigurerAdapter'` prints nothing.
- Full build passes with test failures equal to the baseline.

---

## Worked Example

Illustrative only. Maven service on Boot 2.7.10, Java 11.

- Phase 1: bump to 2.7.18 (commit 1); JDK 11 to 17 in `pom.xml` `<java.version>17</java.version>` and CI image (commit 2); tests pass.
- Phase 2: `rewrite:dryRun` patch touches 63 files (`javax.persistence` to `jakarta.persistence`, parent version 3.0.x). `rewrite:run`, commit 3. Leftover grep empty. Then bump to the 3.3 line with recipe `UpgradeSpringBoot_3_3` (commit 4).
- Phase 3: migrator logs `The use of configuration keys that have been renamed was found... spring.redis.host -> spring.data.redis.host`; fixed, migrator removed (commit 5). `SecurityConfig extends WebSecurityConfigurerAdapter` converted to a `SecurityFilterChain` bean (commit 6). A test `GET /orders/` fails with 404: trailing slash change; user chooses to update the client path. `./mvnw verify` passes.

---

## Exit Criteria

DONE when Boot is at the target on Java 17+, no `javax` EE imports or `WebSecurityConfigurerAdapter` remain, renamed properties are fixed with the migrator removed, and tests equal the baseline.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A starter has no Boot 3 release | **Return**: record it as a blocker; the user picks a replacement. |
| Phase 2 | Recipe name not found | **Adjust**: look up the current name in the OpenRewrite catalog for `rewrite-spring`; never guess. |
| Phase 3 | Trailing-slash or other behavior change breaks clients | **Stop**: report it; restoring old behavior is a design decision for the user. |
| Phase 3 | Hibernate 6 query or ID failures | **Return**: record the failing queries with the Hibernate 6 migration guide section. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
