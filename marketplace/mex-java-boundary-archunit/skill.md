# Java Boundary Enforcement with ArchUnit

**One-line description:** Writes ArchUnit rules as ordinary JUnit 5 tests that fail when code outside the candidate touches anything but its `api` package, when the candidate depends on other domains, or when packages form a cycle, freezes existing violations with ArchUnit's `FreezingArchRule`, and proves the rules bite with a deliberate violation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Maven or Gradle working tree.
- `module_interface` (object, required): From `mex-interface-boundary-contract`; names the public package (for example `com.acme.billing.api`).

---

## Outputs

- `java_boundary_rules` (object): Test class path, each rule's text, the frozen violation store path and its entry count, the test command and its summary line, and the mutation check result.

---

## Phase 1: Add ArchUnit and Write Rules

### Entry Criteria
- `stack` is `java`.

### Actions
1. Add the test dependency `com.tngtech.archunit:archunit-junit5` with `test` scope (Maven) or `testImplementation` (Gradle). Use the latest version listed on Maven Central; do not guess a version number, look it up.
2. Create `src/test/java/com/acme/architecture/BillingBoundaryTest.java`:
   ```java
   @AnalyzeClasses(packages = "com.acme", importOptions = ImportOption.DoNotIncludeTests.class)
   class BillingBoundaryTest {
     @ArchTest
     static final ArchRule outsiders_use_only_api =
         noClasses().that().resideOutsideOfPackage("com.acme.billing..")
             .should().dependOnClassesThat()
             .resideInAnyPackage("com.acme.billing.domain..", "com.acme.billing.store..", "com.acme.billing.internal..");

     @ArchTest
     static final ArchRule billing_does_not_use_other_domains =
         noClasses().that().resideInAPackage("com.acme.billing..")
             .should().dependOnClassesThat()
             .resideInAnyPackage("com.acme.orders..", "com.acme.catalog..");

     @ArchTest
     static final ArchRule no_domain_cycles =
         slices().matching("com.acme.(*)..").should().beFreeOfCycles();
   }
   ```
   Static imports: `com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses` and `com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices`.
3. List the candidate's subpackages with `find src/main/java/com/acme/billing -type d` and put every one except `api` in the first rule.
4. If the app uses Spring Modulith, its `ApplicationModules.of(Application.class).verify()` test enforces similar rules by convention; keep ArchUnit rules anyway because they name the exact packages.

### Output
`BillingBoundaryTest`.

### Quality Gate
- The test class compiles: Maven `./mvnw -q test-compile`; Gradle `./gradlew testClasses`.

---

## Phase 2: Run and Freeze Existing Violations

### Entry Criteria
- Test compiles.

### Actions
1. Run only this test: Maven `./mvnw test -Dtest=BillingBoundaryTest`; Gradle `./gradlew test --tests 'com.acme.architecture.BillingBoundaryTest'`.
2. Read each failure. ArchUnit prints lines such as `Method <com.acme.orders.OrderService.close()> calls method <com.acme.billing.store.InvoiceRepository.save(...)> in (OrderService.java:88)`.
3. Fix violations one caller class per commit by routing through `com.acme.billing.api`.
4. For violations that cannot be fixed now, wrap the rule: `FreezingArchRule.freeze(noClasses()...)`. On first run ArchUnit records current violations in a violation store (by default under `archunit_store` in the working directory; set `freeze.store.default.path` in `src/test/resources/archunit.properties` to choose the path) and afterwards fails only on new ones. Commit the store.
5. Do not mark the test `@Disabled`, delete rules, or widen `resideOutsideOfPackage` to get green.

### Output
A passing boundary test with a committed violation store.

### Quality Gate
- The single-test command reports `Tests run: 3, Failures: 0` (Maven) or `BUILD SUCCESSFUL` with the test listed (Gradle `--info`).
- The violation store directory is tracked: `git ls-files <store path>` lists files.

---

## Phase 3: Prove It Bites

### Entry Criteria
- Test passes.

### Actions
1. On a scratch branch add a field `private com.acme.billing.store.InvoiceRepository repo;` to an orders class and run the single test. It must fail on `outsiders_use_only_api`.
2. Delete the branch. The rule runs in CI already because it is a normal unit test; confirm with the CI log or `rg -n "mvnw|gradlew" .github/workflows`.

### Output
`java_boundary_rules`.

### Quality Gate
- The mutation run failed naming the added field's class.

---

## Worked Example

Illustrative.

```
$ ./mvnw test -Dtest=BillingBoundaryTest
[ERROR] BillingBoundaryTest.outsiders_use_only_api
Architecture Violation [Priority: MEDIUM] - Rule 'no classes that reside outside of package 'com.acme.billing..' should depend on classes that reside in any package ['com.acme.billing.domain..', ...]' was violated (4 times):
Field <com.acme.orders.domain.Order.invoice> has type <com.acme.billing.domain.Invoice> in (Order.java:0)
Method <com.acme.admin.ReportService.monthly()> calls method <com.acme.billing.store.InvoiceRepository.findByMonth(...)> in (ReportService.java:41)
```
`ReportService` fixed through `BillingApi.listInvoices`. The JPA field `Order.invoice` needs the data split first, so the rule is frozen with three entries. Re-run: `Tests run: 3, Failures: 0`.

---

## Exit Criteria

DONE when ArchUnit rules for the API-only boundary, outbound domains and cycles pass with only frozen pre-existing violations, and a deliberate violation fails the build.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | JUnit 4 project | **Adjust**: use `archunit-junit4` and `@RunWith(ArchUnitRunner.class)` per the ArchUnit user guide. |
| Phase 2 | Rule reports thousands of violations from generated code | **Adjust**: add an `ImportOption` that excludes generated packages, as described in the ArchUnit user guide. |
| Phase 2 | Freeze store not created | **Adjust**: set `freeze.store.default.allowStoreCreation=true` in `archunit.properties` for the first run, then remove it so CI cannot silently create a new store. |
| Phase 3 | Mutation does not fail | **Retry**: the package pattern does not match; print the class's package with `javap` and correct the `..` pattern. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
