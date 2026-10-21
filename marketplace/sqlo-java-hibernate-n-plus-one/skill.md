# Hibernate and Spring Data JPA N+1 Query Fix

**One-line description:** Detects N+1 queries in a Spring Boot or Jakarta EE code path using Hibernate statistics and SQL logging, fixes each with `JOIN FETCH`, `@EntityGraph`, batch fetching or a DTO projection, avoids the in-memory pagination and MultipleBagFetchException traps, and pins the statement count in a test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Project root with `pom.xml` or `build.gradle`.
- `test_command` (string, required): For example `./mvnw test` or `./gradlew test`.
- `suspect_endpoint` (string, required): Controller method, service method or repository call suspected of N+1.

---

## Outputs

- `n_plus_one_fixes` (object[]): Per fix: file and line, query or mapping before and after, statement counts at two sizes, and the pinning test.

---

## Phase 1: Count Statements

### Entry Criteria
- `test_command` passes before any change.
- Hibernate version recorded from the dependency tree (`./mvnw dependency:tree | grep hibernate-core` or `./gradlew dependencies | grep hibernate-core`).

### Actions
1. In the test configuration (`src/test/resources/application.properties` for Spring Boot):
```
spring.jpa.properties.hibernate.generate_statistics=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.stat=DEBUG
```
2. Write a `@SpringBootTest` (or `@DataJpaTest`) that seeds 10 parents with children, clears statistics, calls the code, and reads the count:
```java
@Autowired EntityManagerFactory emf;
Statistics stats() { return emf.unwrap(SessionFactory.class).getStatistics(); }

@Test void ordersListStatements() {
    seedOrders(10, 3);
    stats().clear();
    orderService.listShipped();
    System.out.println("statements=" + stats().getPrepareStatementCount());
}
```
3. Repeat with 20 parents. Growth means N+1.
4. Read the SQL log: the repeated `select ... from order_item where order_id=?` names the association.
5. Check mappings: `@ManyToOne` and `@OneToOne` default to `FetchType.EAGER` in JPA, which loads them per row even when unused. Record any default-EAGER association on the path.

### Output
Counts at two sizes and named associations.

### Quality Gate
- Two counts recorded from `getPrepareStatementCount()` output.
- Every association on the path has its fetch type recorded.

---

## Phase 2: Apply the Fix

### Entry Criteria
- N+1 confirmed.

### Actions
1. Choose:

| Situation | Fix |
|---|---|
| Spring Data repository method needs the association | `@EntityGraph(attributePaths = {"customer", "items"})` on the method |
| JPQL query | `select distinct o from Order o join fetch o.customer left join fetch o.items where o.status = :s` |
| Collection fetch plus pagination (`Pageable`) | do not join fetch the collection: Hibernate warns `HHH000104` (Hibernate 5) or `HHH90003004` (Hibernate 6) and paginates in memory. Instead page the parent ids first, then `join fetch` where `o.id in :ids`; or use batch fetching |
| Many parents, collection accessed per parent | `spring.jpa.properties.hibernate.default_batch_fetch_size=N` or `@BatchSize(size = N)` on the collection; loads children in `IN` batches (N chosen with the user; it bounds the IN list length) |
| Two `List` collections fetched together | Hibernate throws `MultipleBagFetchException`; fetch one per query, change one to `Set` if semantics allow, or use batch fetching |
| Read-only listing | DTO projection: `select new com.shop.OrderRow(o.id, o.total, c.name) from Order o join o.customer c` |
| `@ManyToOne` default EAGER | set `fetch = FetchType.LAZY` and fetch explicitly where needed; run the full suite because other code may rely on eager loading |

2. Do not enable `spring.jpa.open-in-view` behavior changes or `hibernate.enable_lazy_load_no_trans` to hide lazy loading errors; both keep the N+1 and add connections held per request.
3. Change one repository method or one mapping per edit.

### Output
Fetch strategy changed at one site.

### Quality Gate
- `git diff --stat` shows only the intended file.
- The build compiles: `./mvnw -q compile` or `./gradlew compileJava` exit 0.

---

## Phase 3: Pin and Run

### Entry Criteria
- Phase 2 edit made.

### Actions
1. Rerun the counting test at both sizes; counts must match.
2. Assert: `assertEquals(EXPECTED, stats().getPrepareStatementCount());` with the post-fix count. Alternative library: datasource-proxy (`net.ttddyy:datasource-proxy`) with `QueryCountHolder.getGrandTotal()`.
3. Search the test log for `HHH000104` or `HHH90003004`. If present, the fix paginates in memory; go back to Phase 2.
4. Run the full `test_command`. Do not delete, disable (`@Disabled`) or loosen tests.

### Output
`n_plus_one_fixes`.

### Quality Gate
- Equal counts at both sizes.
- The test log contains no `HHH000104` or `HHH90003004` warning for this path.
- Full `test_command` exit code is 0.

---

## Worked Example

Illustrative only.

Input: `OrderController.list()` calling `orderRepository.findByStatus("SHIPPED", PageRequest.of(0, 50))`.

Phase 1: 10 orders gives 21 statements; 20 gives 41. `Order.customer` is `@ManyToOne` (default EAGER); `Order.items` is `@OneToMany` lazy, accessed in the DTO mapper.

Phase 2: `OrderRepository.java` line 14:
```java
@EntityGraph(attributePaths = {"customer"})
Page<Order> findByStatus(String status, Pageable pageable);
```
plus `@BatchSize(size = 50)` on `Order.items` (50 equals the page size, chosen with the user).

Phase 3: 4 statements at both sizes (count, page with customer join, one items batch, one sequence read). No `HHH90003004` in the log. `./mvnw test`: Tests run: 233, Failures: 0, Errors: 0.

---

## Exit Criteria

DONE when counts are constant across sizes, no in-memory pagination warning appears, a test pins the count, and the full suite passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Statistics show 0 statements | **Adjust**: confirm `hibernate.generate_statistics=true` is in the test profile actually loaded. |
| Phase 2 | `MultipleBagFetchException` | **Adjust**: fetch one collection per query or use batch fetching, per the table. |
| Phase 2 | `LazyInitializationException` after setting LAZY | **Adjust**: add the association to the `@EntityGraph` of the method that needs it; do not revert to EAGER. |
| Phase 3 | In-memory pagination warning | **Return**: go back to Phase 2 and use the two-step id paging. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
