# Normalize to Third Normal Form

**One-line description:** Writes down the functional dependencies of every entity, tests them against real data when a database is available, and decomposes the model through 1NF, 2NF, 3NF and a BCNF check so that each fact is stored exactly once.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `er_model` (object, required): Entity-relationship model from `dbs-entity-relationship-model`.
- `sample_data_url` (string, optional): Connection URL to a non-production database holding real or production-shaped data for the same domain. Used only for read-only queries.

---

## Outputs

- `normalized_schema` (object): Relations in at least 3NF, each with its attributes, candidate keys, and the dependencies it enforces.
- `functional_dependencies` (object[]): Every dependency written as `determinant -> dependent`, with its source (spec rule or data check) and test result.

---

## Phase 1: Write the Functional Dependencies

### Entry Criteria
- `er_model` present.

### Actions
1. For each entity, list every rule of the form "if you know X, you know exactly one Y". Write it as `X -> Y`. Example: `order_number -> customer_id`, `product_id -> product_name`, `(order_id, line_no) -> quantity`.
2. Take each rule from the spec or a domain fact. Note the source. A rule that holds in today's data by coincidence (all customers in one city) is not a dependency; do not write it.
3. List the candidate keys of each entity: the minimal attribute sets that determine all other attributes.
4. If `sample_data_url` is given, falsify each dependency with a read-only query. For `X -> Y` on table `t`:
   ```sql
   SELECT X, COUNT(DISTINCT Y) AS n
   FROM t GROUP BY X HAVING COUNT(DISTINCT Y) > 1 LIMIT 20;
   ```
   Zero rows means the data does not contradict it. Any row means either the rule is wrong or the data is dirty; record which, with the rows.

### Output
`functional_dependencies` with sources and test results.

### Quality Gate
- Every dependency has a source.
- When `sample_data_url` is given, every dependency has a query and a row count recorded.

---

## Phase 2: Decompose

### Entry Criteria
- Dependencies listed.

### Actions
1. 1NF: every attribute holds one value. Move repeating groups and lists to child relations (one row per value).
2. 2NF: for every relation whose candidate key has more than one attribute, find any non-key attribute that depends on only part of the key. Move it to a relation keyed by that part. Example: `order_line(order_id, product_id, order_date)` with key `(order_id, product_id)` has `order_id -> order_date`: move `order_date` to `order`.
3. 3NF: for every non-key attribute A that depends on another non-key attribute B (`key -> B -> A`), move A to a relation keyed by B. Example: `customer(customer_id, zip, city)` with `zip -> city` is a transitive dependency. Decide with the table below.
4. BCNF: for each remaining dependency `X -> Y`, check that X is a candidate key. If not, record it; decompose only if the decomposition preserves every dependency, otherwise keep 3NF and record why.

| Transitive dependency found | Action |
|---|---|
| Dependent value is a shared fact that changes centrally (product name, category label) | Decompose into its own relation |
| Dependent value is a historical snapshot (price paid, shipping address used) | Keep it on the event relation; it is a different fact from the current value |
| Dependency is only true in some countries or cases (zip to city) | Keep it; record it as not a true dependency |

### Output
Draft `normalized_schema`.

### Quality Gate
- Every relation lists its candidate keys.
- For every dependency in `functional_dependencies`, the relation that enforces it is named.
- Zero partial dependencies and zero transitive dependencies remain unless recorded in the table above with a reason.

---

## Phase 3: Check the Decomposition Is Lossless

### Entry Criteria
- Draft `normalized_schema` exists.

### Actions
1. For each split, confirm the shared attributes form a key of at least one of the two resulting relations. This is the lossless-join condition.
2. Re-trace every access pattern through the new relations and count joins per pattern. Record the count; do not change the design here. Denormalization is decided in `dbs-denormalize-decision`.
3. If `sample_data_url` is given, run the split as two `SELECT DISTINCT` queries and rejoin them; the rejoined row count must equal the original count.

### Output
Final `normalized_schema` with join counts per access pattern.

### Quality Gate
- Every split names the shared key that makes it lossless.
- When data was available, the rejoin row count equals the original row count, with both numbers recorded.

---

## Common Mistakes To Avoid

- Do not treat a coincidence in sample data as a dependency.
- Do not denormalize in this flow, even if a pattern now needs three joins. Record the join count and move on.
- Do not run any write statement against `sample_data_url`. Only `SELECT`.
- Do not split historical snapshot columns into a reference to the live value.

---

## Worked Example

Illustrative only. Entity `order_line(order_id, line_no, product_id, product_name, unit_price, customer_email)`.

Phase 1: dependencies `(order_id, line_no) -> product_id, unit_price`, `product_id -> product_name`, `order_id -> customer_email`. Query `SELECT product_id, COUNT(DISTINCT product_name) FROM order_line GROUP BY product_id HAVING COUNT(DISTINCT product_name) > 1 LIMIT 20;` returns 3 rows: renamed products. Recorded: rule holds, data holds old names.

Phase 2: `customer_email` depends on part of the key (`order_id`) and moves to `order`, then on to `customer` through `order.customer_id`. `product_name` moves to `product`. `unit_price` stays (historical snapshot).

Phase 3: split on `product_id`, which is the key of `product`: lossless. Rejoin count 48,211 equals original 48,211. AP01 now needs 1 join.

---

## Exit Criteria

DONE when every relation is in 3NF or has a recorded reason, every dependency is tested or sourced, and every split is shown lossless.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Falsification query returns rows | **Return**: ask the domain owner whether the rule or the data is wrong; record the answer. |
| Phase 1 | `sample_data_url` points at production | **Stop**: use a replica or a restored copy; never run exploratory queries on the primary. |
| Phase 2 | BCNF decomposition would lose a dependency | **Adjust**: keep 3NF and enforce the dependency with a constraint later; record it. |
| Phase 3 | Rejoin count differs | **Retry**: the shared attributes are not a key; redo the split in Phase 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
