# Merkle Tree Build over Log Records

**One-line description:** Build a Merkle tree over the record content hashes using RFC 6962 leaf and node hashing with domain-separation prefixes, producing a tree head that summarizes the whole log.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `record_schema` (object, required): The record fields, so the leaf input (each record's content_hash) is identified.
- `hash_algorithm_spec` (object, required): The hash function and the leaf and node domain-separation prefixes.
- `repo_path` (string, required): Path to the repository where the tree build module and tests are written.

---

## Outputs

- `merkle_tree_spec` (object): The leaf and node hashing rules, the odd-node handling, the tree-head computation, and the module location.

---

## Phase 1: Define leaf and node hashing

### Entry Criteria
- `hash_algorithm_spec` gives the prefixes.
- `record_schema` identifies each record's content_hash.

### Actions
1. Define the leaf hash with domain separation per RFC 6962: leaf = SHA-256(0x00 || record_content_hash). The 0x00 prefix stops a leaf from being reinterpreted as an internal node.
2. Define the internal node hash: node = SHA-256(0x01 || left_child || right_child). The 0x01 prefix separates nodes from leaves so a second-preimage across levels is not possible.
3. Define odd-node handling the RFC 6962 way: when a level has an odd count, the last node is carried up to the next level unchanged (not duplicated), which avoids the duplicate-leaf ambiguity of naive trees.
4. State that leaves are ordered by `seq`, so the tree order matches the chain order and an inclusion proof position maps to a record position.

### Output
The leaf, node, and odd-node rules written with their prefixes.

### Quality Gate
- Leaf hashing uses the 0x00 prefix and node hashing uses the 0x01 prefix.
- Odd nodes are carried up, not duplicated.
- Leaf order is defined by `seq`.

---

## Phase 2: Compute the tree head and test

### Entry Criteria
- The leaf and node rules exist.
- `repo_path` is writable.

### Actions
1. Implement the build: hash each record's content_hash into a leaf, then repeatedly hash pairs up the levels applying the odd-node rule until one root remains; that root is the tree head for the current tree size.
2. Record the tree head together with the tree size (number of leaves), because a head is only meaningful paired with its size for later consistency checks.
3. Write a test with a known small input (for example 1, 2, 3, and 4 leaves) and assert the tree head matches a value computed by hand or by a reference library, so the prefixes and odd-node rule are confirmed.
4. Run the test and read the output; do NOT change the expected head to match a buggy build. If they differ, fix the hashing order or prefixes.

### Output
`merkle_tree_spec` with the tree-head computation and a passing known-answer test.

### Quality Gate
- The tree head is stored with the tree size.
- A known-answer test for small sizes passes on an executed run.
- The build applies the 0x00 and 0x01 prefixes and the odd-node carry rule.

---

## Worked Example

Input (illustrative): three leaves L0, L1, L2 from seq 0..2.

Phase 2 (illustrative):

```
leaf_i  = SHA256(0x00 || content_hash_i)
n01     = SHA256(0x01 || leaf_0 || leaf_1)
head    = SHA256(0x01 || n01 || leaf_2)     # L2 carried up (odd)
tree: size=3, head=<32-byte hex>
```

The known-answer test for sizes 1..4 passes; `merkle_tree_spec` records the module path and rules.

---

## Exit Criteria

DONE when `merkle_tree_spec` defines RFC 6962 leaf and node hashing with the 0x00 and 0x01 prefixes, carries odd nodes up, orders leaves by `seq`, stores the head with the size, and a known-answer test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Leaf and node use the same hash input layout | **Stop**: add the 0x00 and 0x01 domain prefixes; without them a leaf can be passed off as a node. |
| Phase 1 | Odd node is duplicated instead of carried | **Adjust**: carry the last node up per RFC 6962 so two distinct logs cannot share a head. |
| Phase 2 | Known-answer head does not match | **Retry**: check leaf order by `seq` and the prefix bytes before changing any expected value. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
