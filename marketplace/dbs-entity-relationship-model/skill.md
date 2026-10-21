# Entity Relationship Model

**One-line description:** Turns the entity list and access patterns into an entity-relationship model with attributes, explicit cardinality (one-to-one, one-to-many, many-to-many), optionality, and ownership, and renders it as a Mermaid `erDiagram` that a reviewer can check line by line.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `entity_list` (string[], required): Candidate entities from `dbs-access-pattern-inventory`.
- `access_patterns` (object[], required): Access-pattern table from `dbs-access-pattern-inventory`.

---

## Outputs

- `er_model` (object): Entities with attributes (name, logical type, required or optional, source `ap_id`), and relationships (from, to, cardinality, optionality on each side, ownership: owned child or independent).
- `er_diagram` (string): Mermaid `erDiagram` source for `er_model`.

---

## Phase 1: Attributes Per Entity

### Entry Criteria
- `entity_list` and `access_patterns` are present.

### Actions
1. For each entity, list every column named in any access pattern that touches it, with the `ap_id` that needs it.
2. Assign a logical type to each attribute from this table. Physical types come later.

| Attribute meaning | Logical type |
|---|---|
| Money amount | decimal with fixed scale (currency minor units or exact decimal) |
| Point in time | timestamp with time zone |
| Calendar date with no time (birthday, due date) | date |
| Free text | text |
| Fixed set of values (status) | enumerated value set, list the values |
| Yes or no | boolean |
| Count or quantity | integer |
| Identifier from another system | text (never integer, even if it looks numeric today) |

3. Mark each attribute `required` or `optional` from the spec. If the spec does not say, mark `optional` and add an open question.
4. If one attribute holds several values (a comma list of tags, phone1/phone2/phone3), mark it `multivalued`. It becomes its own entity in step 2 of Phase 2.

### Output
Attribute list per entity.

### Quality Gate
- Every attribute cites at least one `ap_id`.
- Zero money attributes typed as floating point.

---

## Phase 2: Relationships and Cardinality

### Entry Criteria
- Attribute lists exist.

### Actions
1. For each pair of entities that appear together in one access pattern or one atomic write group, ask two questions and write both answers: "How many B can one A have?" and "How many A can one B have?" Answers are exactly `zero or one`, `exactly one`, `zero or more`, `one or more`.
2. Map the answers to a relationship type:

| A to B | B to A | Type | Physical shape (later) |
|---|---|---|---|
| zero or more | exactly one | one-to-many | foreign key on B |
| zero or more | zero or one | optional one-to-many | nullable foreign key on B |
| zero or more | zero or more | many-to-many | junction entity with two foreign keys |
| zero or one | exactly one | one-to-one | foreign key on B with unique constraint |

3. Turn every `multivalued` attribute into a child entity in a one-to-many relationship.
4. Turn every many-to-many into a named junction entity. If the relationship itself has attributes (quantity, role, joined_at), they go on the junction entity.
5. Mark ownership: `owned` when the child cannot exist without the parent and is deleted with it (order_line under order); `independent` otherwise (order to customer).
6. Record whether historical values must be kept (price at time of order, address at time of shipment). Such values are attributes of the event entity, not references to the current value.

### Output
`er_model` with relationships.

### Quality Gate
- Every relationship has both cardinality answers written.
- Zero many-to-many relationships remain without a junction entity.
- Every relationship has `owned` or `independent`.

---

## Phase 3: Render and Check the Diagram

### Entry Criteria
- `er_model` complete.

### Actions
1. Write `er_diagram` in Mermaid syntax. Cardinality markers: `||` exactly one, `o|` zero or one, `}o` zero or more, `}|` one or more. Example line: `CUSTOMER ||--o{ ORDER : places`.
2. Render it to check syntax: `npx -y @mermaid-js/mermaid-cli -i er.mmd -o er.svg` (the CLI binary is `mmdc`). If rendering is unavailable, paste into the Mermaid Live Editor and confirm no parse error.
3. For each access pattern, trace the path through the diagram that answers it. If a pattern needs data with no path, add the missing relationship or attribute.

### Output
`er_diagram`.

### Quality Gate
- `mmdc` exits 0, or the live editor shows no parse error.
- Every `ap_id` has a traced path written next to it.

---

## Common Mistakes To Avoid

- Do not add an `id` attribute yet. Keys are chosen in `dbs-primary-key-strategy`.
- Do not model "current price" as a reference when the order must remember the price paid.
- Do not store a list in one text column because "it is simpler". Lists become child rows.
- Do not use Mermaid relationship labels with spaces unless quoted; `places` works, `places order` must be `"places order"`.

---

## Worked Example

Illustrative only. `entity_list` = [customer, order, order_line, product, tag].

Phase 1: `order.total` typed decimal, `order.created_at` timestamp with time zone, `product.tags` marked multivalued.

Phase 2: customer to order is one-to-many (customer has zero or more orders; order has exactly one customer), independent. order to order_line is one-to-many, owned. product to tag is many-to-many, junction `product_tag`. `order_line.unit_price` kept as a historical attribute.

Phase 3:
```
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ ORDER_LINE : contains
  PRODUCT ||--o{ ORDER_LINE : "sold as"
  PRODUCT ||--o{ PRODUCT_TAG : has
  TAG ||--o{ PRODUCT_TAG : labels
```
`npx -y @mermaid-js/mermaid-cli -i er.mmd -o er.svg` exits 0. AP01 traced: CUSTOMER to ORDER.

---

## Exit Criteria

DONE when every entity has typed attributes tied to access patterns, every relationship has both cardinalities and ownership, and the diagram renders and traces every access pattern.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Attribute needed by no access pattern | **Adjust**: leave it out and list it as unused; add it back only if the spec owner names a use. |
| Phase 2 | Cardinality question unanswerable from spec | **Return**: ask the spec owner; record the question with both candidate answers. |
| Phase 3 | `mmdc` fails to install (no network) | **Adjust**: validate in the Mermaid Live Editor and record that it was used. |
| Phase 3 | An access pattern has no path | **Retry**: return to Phase 2 and add the relationship. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
