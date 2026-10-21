# JVM Outdated Inventory

**One-line description:** Produces a normalized list of outdated Maven or Gradle dependencies and plugins using the Versions Maven Plugin or the Gradle Versions Plugin, with BOM-managed versions (Spring Boot, Jackson, Netty) attributed to the BOM that controls them.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `package_manager` (`maven` or `gradle`), `target_packages`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Build must pass.

---

## Outputs

- `outdated_inventory` (object[]): One record per outdated artifact: `ecosystem` (`maven`), `name` (`groupId:artifactId`), `current`, `wanted` (newest same-major), `latest`, `update_type`, `direct`, `dev` (test scope), `managed_by` (BOM coordinates or `self`), `kind` (`dependency`, `plugin`, `property`). Also written to `<work_dir>/outdated.json`.

---

## Phase 1: Collect Raw Data

### Entry Criteria
- `upgrade_scope.stack == "jvm"` and baseline build passed.

### Actions
1. Maven (use `./mvnw` when present):
   - `./mvnw -B org.codehaus.mojo:versions-maven-plugin:display-dependency-updates > .dep-upgrade/mvn-dep-updates.txt`
   - `./mvnw -B org.codehaus.mojo:versions-maven-plugin:display-plugin-updates > .dep-upgrade/mvn-plugin-updates.txt`
   - `./mvnw -B org.codehaus.mojo:versions-maven-plugin:display-property-updates > .dep-upgrade/mvn-prop-updates.txt`
   - To exclude alphas and milestones, check the goal's parameters with `./mvnw versions:help -Ddetail=true -Dgoal=display-dependency-updates` (look for `ruleSet`/`rulesUri` and version-ignore options) rather than guessing flags.
   - Lines read `groupId:artifactId ......... 2.15.2 -> 2.17.2`.
2. Gradle: the Gradle Versions Plugin (`com.github.ben-manes.versions`) is third-party. If the build does not apply it, ask before adding it; alternatively run it from an init script in `<work_dir>` so no build file changes. Run `./gradlew dependencyUpdates -Drevision=release`. Report: `build/dependencyUpdates/report.txt` (also JSON when `outputFormatter` includes json).
3. Gradle version catalogs: if `gradle/libs.versions.toml` exists, versions live in its `[versions]` table; record the catalog key for each artifact.
4. Dependency tree for attribution: Maven `./mvnw -B dependency:tree -DoutputFile=.dep-upgrade/mvn-tree.txt`; Gradle `./gradlew dependencies --configuration runtimeClasspath > .dep-upgrade/gradle-tree.txt`.

### Output
Raw update reports and dependency trees.

### Quality Gate
- Each report file exists and the build tool exited 0.

---

## Phase 2: Attribute And Classify

### Entry Criteria
- Reports exist.

### Actions
1. `managed_by`: if the artifact has no explicit version in your build file, find which BOM sets it. Maven: `./mvnw help:effective-pom -Doutput=.dep-upgrade/effective-pom.xml` and search for the artifact in `dependencyManagement`; the `spring-boot-dependencies` BOM manages hundreds of artifacts. Gradle: `./gradlew dependencyInsight --dependency <artifactId> --configuration runtimeClasspath` shows `(by constraint)` or the platform.
2. Rule: never bump an artifact that a BOM manages by overriding it individually as a first move. Record it under the BOM's record (`managed_by=org.springframework.boot:spring-boot-dependencies:3.3.4`); the BOM is the thing to upgrade.
3. Exception for security: a BOM-managed artifact with a known vulnerability may be overridden through the BOM's version property (Spring Boot documents properties such as `jackson-bom.version`; check the Boot reference "Version Properties" appendix for the exact name). Record `kind=property`.
4. `update_type` by semver on the version numbers; qualifiers like `.RELEASE`, `-jre`, `.Final` are ignored for comparison.
5. `dev=true` for `test` scope (Maven) or `testImplementation` (Gradle).
6. Filter to `target_packages`; merge into `<work_dir>/outdated.json` by (`ecosystem`, `name`).

### Output
`outdated_inventory`.

### Quality Gate
- Every record has `managed_by` set to a BOM coordinate or `self`, with evidence from the effective POM or `dependencyInsight`.

---

## Worked Example

Illustrative only. Maven project on `spring-boot-starter-parent` 2.7.18.

- Phase 1: `display-dependency-updates` prints `org.apache.commons:commons-text ... 1.10.0 -> 1.12.0` and `com.fasterxml.jackson.core:jackson-databind ... 2.13.5 -> 2.18.0`. `display-plugin-updates` prints `maven-surefire-plugin ... 2.22.2 -> 3.5.0`.
- Phase 2: jackson-databind has no version in `pom.xml`; the effective POM shows it under `spring-boot-dependencies`, so `managed_by=org.springframework.boot:spring-boot-dependencies:2.7.18`. commons-text is `self`, `minor`. surefire is a `plugin`, `major`.

---

## Exit Criteria

DONE when `<work_dir>/outdated.json` holds JVM records with BOM attribution.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Gradle Versions Plugin not applied and user declines | **Adjust**: compare `./gradlew dependencies` output against Maven Central search by hand for direct deps only. |
| Phase 1 | Corporate repository mirror blocks metadata | **Return**: record which repositories were queried (`settings.xml` mirrors); results may be partial. |
| Phase 2 | Artifact managed by two BOMs | **Return**: Maven uses the first imported BOM in `dependencyManagement`; record both and the winner. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
