# Merkle Inclusion Proof Generate and Verify

**One-line description:** Generate an audit path that proves a single record is in the tree at a given size, and verify it by recomputing the tree head from the leaf and the sibling hashes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `merkle_tree_spec` (object, required): The leaf and node hashing rules, odd-node handling, and tree-head computation to build and check the proof.

---

## Outputs

- `inclusion_proof_procedure` (object): The generation steps for an audit path and the verification steps that recompute the head, with a passing round-trip test.

---

## Phase 1: Generate the audit path

### Entry Criteria
- `merkle_tree_spec` defines leaf and node hashing.

### Actions
1. Define the inputs to a proof: the leaf index (the record `seq`), the tree size, and the record `content_hash`.
2. Generate the audit path per RFC 6962: walk from the leaf to the root collecting the sibling hash at each level, applying the same odd-node carry rule from `merkle_tree_spec`.
3. Record for each path element whether the sibling is on the left or the right, because the verifier must concatenate in the correct order before hashing with the 0x01 node prefix.
4. State that the proof does not include the leaf data itself beyond the `content_hash`, so the proof is small and reveals only sibling hashes.

### Output
An audit path: an ordered list of sibling hashes with left or right positions.

### Quality Gate
- The proof names the leaf index and the tree size it was built against.
- Each path element records its left or right position.
- The path is collected with the same odd-node rule as `merkle_tree_spec`.

---

## Phase 2: Verify by recomputing the head

### Entry Criteria
- An audit path exists.

### Actions
1. Verify by starting from the leaf hash (0x00 prefix) and folding in each sibling with the 0x01 node prefix in the recorded left or right order, producing a candidate head.
2. Compare the candidate head to the known tree head for that size; equal means the record is included, unequal means the proof or the record is wrong.
3. Write a round-trip test: build a tree, generate a proof for a middle leaf and an edge leaf, verify both against the head, then corrupt one sibling and assert verification fails.
4. Run the test and read the output; do NOT accept a proof whose recomputed head differs from the stored head.

### Output
`inclusion_proof_procedure` with generate and verify steps and a passing round-trip test.

### Quality Gate
- Verification recomputes the head and compares it to the stored head for the size.
- A corrupted sibling makes verification fail in the test.
- Both a middle and an edge leaf verify on an executed run.

---

## Worked Example

Input (illustrative): tree size 3, prove leaf index 2.

```
path for L2 (size 3): [ (n01, left) ]
verify: cand = SHA256(0x01 || n01 || leaf_2); assert cand == head
corrupt n01 -> cand != head -> INVALID (expected)
```

`inclusion_proof_procedure` records the steps and the PASS result.

---

## Exit Criteria

DONE when `inclusion_proof_procedure` generates an ordered audit path with positions, verifies by recomputing the head with the correct prefixes, and a round-trip test passes while a corrupted sibling fails.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Path omits left or right position | **Adjust**: record the position per element; concatenation order changes the node hash and the result. |
| Phase 2 | Verification ignores the tree size | **Stop**: a proof is only valid against the head for its size; include and check the size. |
| Phase 2 | Corrupted-sibling test still verifies | **Retry**: confirm the node prefix 0x01 and the fold order before trusting the verifier. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
