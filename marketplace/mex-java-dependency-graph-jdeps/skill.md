# Java Class Dependency Graph with jdeps

**One-line description:** Runs the JDK's `jdeps` against the compiled monolith classes to list every class-level dependency into and out of the candidate package, separates framework wiring (Spring beans, JPA relationships) that bytecode shows but that matters differently, and records package cycles through the candidate.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree with a Maven or Gradle build.
- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`; supplies `candidate_module` as a package name (for example `com.acme.billing`).

---

## Outputs

- `java_dependency_graph` (object): `classes_dir`, `candidate_package`, `inbound_edges` and `outbound_edges` as `from_class -> to_class`, `package_cycles`, `jpa_cross_boundary_relations`, `spring_injection_edges`, and paths to the raw jdeps output files.

---

## Phase 1: Compile and Locate Class Output

### Entry Criteria
- `extraction_brief.stack` == `java`.
- `jdeps -version` prints the same major version as `java -version`.

### Actions
1. Compile without running tests: Maven `./mvnw -q -DskipTests compile`; Gradle `./gradlew classes`.
2. Classes directory: Maven `target/classes`; Gradle `build/classes/java/main` (and `build/classes/kotlin/main` for Kotlin). For multi-module builds, list every module's classes dir.
3. Build the runtime classpath so jdeps can resolve library classes: Maven `./mvnw -q dependency:build-classpath -Dmdep.outputFile=/tmp/mex_cp.txt`; Gradle: add nothing to the build, instead run `./gradlew -q dependencies --configuration runtimeClasspath` to read it, or use `--ignore-missing-deps` in jdeps (check `jdeps --help` for it in your JDK) when the classpath cannot be produced.

### Output
Classes directories and a classpath file.

### Quality Gate
- `find target/classes -name '*.class' | head -1` (or the Gradle path) prints a file.

---

## Phase 2: Run jdeps

### Entry Criteria
- Classes exist.

### Actions
1. Class-level dependencies across the whole app, written to a file:
   ```
   jdeps -verbose:class -filter:none --class-path "$(cat /tmp/mex_cp.txt)" target/classes > /tmp/mex_jdeps_class.txt
   ```
   `-filter:none` keeps same-package and same-archive edges that the default filter hides.
2. Package-level summary in DOT form for a picture: `jdeps -verbose:package --dot-output /tmp/mex_dot --class-path "$(cat /tmp/mex_cp.txt)" target/classes`.
3. Lines in the class output look like `   com.acme.orders.CheckoutService -> com.acme.billing.InvoiceService   classes`. Do not use `grep -E` with lookahead (`(?!...)`); POSIX grep does not support it. Extract inbound edges with awk:
   ```
   awk '$2=="->" && $1 !~ /^com\.acme\.billing\./ && $3 ~ /^com\.acme\.billing\./ {print $1, $3}' /tmp/mex_jdeps_class.txt | sort -u
   ```
4. Outbound edges inside the app:
   ```
   awk '$2=="->" && $1 ~ /^com\.acme\.billing\./ && $3 ~ /^com\.acme\./ && $3 !~ /^com\.acme\.billing\./ {print $1, $3}' /tmp/mex_jdeps_class.txt | sort -u
   ```
5. Package cycles: from the DOT file, a package pair present in both directions is a cycle. Record pairs that include the candidate.

### Output
Inbound and outbound class edges, package cycles.

### Quality Gate
- The awk inbound and outbound counts equal the list lengths in `java_dependency_graph`.
- At least one edge is printed by step 3 or the brief already said the candidate has no callers.

---

## Phase 3: Framework Edges jdeps Cannot Classify

### Entry Criteria
- Class edges listed.

### Actions
1. JPA relations across the boundary are the hardest edges to cut (they become a database join): `rg -n "@(ManyToOne|OneToMany|OneToOne|ManyToMany)" src/main/java` and keep annotations on fields whose type is in the other side of the boundary. Record entity, field and target into `jpa_cross_boundary_relations`.
2. Spring injection by interface hides the implementation edge: `rg -n "@Autowired|@Inject|private final [A-Z][A-Za-z]+ [a-z]" src/main/java/com/acme/orders` and keep injected types from the candidate. Record in `spring_injection_edges`.
3. String-based coupling invisible to bytecode: `rg -n "\"com\.acme\.billing|@Qualifier\(|@ConditionalOnProperty|@KafkaListener\(topics" src/main`.
4. If the project uses Spring Modulith, also run its verification test (`ApplicationModules.of(Application.class).verify()`) and paste violations; it reports module boundary breaks in Spring terms.

### Output
`java_dependency_graph`.

### Quality Gate
- Every JPA relation crossing the boundary is listed with file and line.

---

## Worked Example

Illustrative. Spring Boot Maven app, candidate `com.acme.billing`.

```
$ ./mvnw -q -DskipTests compile
$ jdeps -verbose:class -filter:none --class-path "$(cat /tmp/mex_cp.txt)" target/classes > /tmp/mex_jdeps_class.txt
$ awk '$2=="->" && $1 !~ /^com\.acme\.billing\./ && $3 ~ /^com\.acme\.billing\./ {print $1, $3}' /tmp/mex_jdeps_class.txt | sort -u | wc -l
58
```
Top inbound targets: `com.acme.billing.domain.Invoice` (31 classes), `com.acme.billing.InvoiceService` (12). JPA: `com.acme.orders.domain.Order.invoice @OneToOne` at `Order.java:47`. Cycle: `com.acme.billing <-> com.acme.orders`.

---

## Exit Criteria

DONE when `java_dependency_graph` lists every class edge across the boundary from jdeps output, all package cycles through the candidate, and every JPA relation and injected type crossing the boundary.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Build fails at baseline | **Stop**: the baseline must compile; return to `mex-extraction-candidate-brief`. |
| Phase 2 | jdeps prints `not found` for library classes | **Adjust**: supply the classpath; library-side edges are not needed, so `not found` targets outside `com.acme` can be ignored. |
| Phase 2 | Multi-release JAR warning | **Adjust**: add `--multi-release <version>` matching the runtime JDK. |
| Phase 3 | Lombok or annotation processors generate the coupling | **Adjust**: read the generated sources under `target/generated-sources` and count them as real edges. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
