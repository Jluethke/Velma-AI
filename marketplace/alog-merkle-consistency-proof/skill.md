# Merkle Consistency Proof Between Tree Sizes

**One-line description:** Prove that a later, larger tree is an append-only extension of an earlier tree, using an RFC 6962 consistency proof so a published head cannot be silently rewritten.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `merkle_tree_spec` (object, required): The tree hashing rules and head computation used to build and verify a consistency proof between two sizes.

---

## Outputs

- `consistency_proof_procedure` (object): The steps to generate and verify a proof that the tree at size N is a prefix of the tree at size M, with a passing test.

---

## Phase 1: Generate the consistency proof

### Entry Criteria
- `merkle_tree_spec` defines node hashing and heads.

### Actions
1. State the goal: given an old head at size N and a new head at size M (M greater than N), prove every record counted in N is unchanged and still present in M, so the log only appended.
2. Generate the consistency proof per RFC 6962: collect the minimal set of node hashes that let a verifier recompute both the old head (size N) and the new head (size M) from shared subtrees.
3. Record the two sizes N and M with the proof, since a consistency proof is meaningless without the pair of sizes it connects.
4. State that this proof is what makes external anchoring valuable: a verifier compares a newly published head to an anchored older head and rejects a rewrite that is not a clean extension.

### Output
A consistency proof node set tied to sizes N and M.

### Quality Gate
- The proof names both sizes N and M with M greater than N.
- The node set is the minimal RFC 6962 set, not the whole tree.
- The purpose (detecting a non-append rewrite) is stated.

---

## Phase 2: Verify both heads and test

### Entry Criteria
- A consistency proof exists.

### Actions
1. Verify by recomputing the old head at size N and the new head at size M from the proof nodes, then assert both match the known heads; a mismatch means the new tree is not an extension of the old one.
2. Write a positive test: build a tree at size N, append records to size M, generate the proof, and assert both heads recompute. Write a negative test: alter a record inside the first N and assert the proof fails.
3. Run both tests and read the output; a passing negative test (the altered-prefix case fails) is the real evidence the proof detects rewrites.
4. Record the generate and verify steps and the test results in `consistency_proof_procedure`.

### Output
`consistency_proof_procedure` with verification steps and passing positive and negative tests.

### Quality Gate
- Verification recomputes both heads and compares to the known heads.
- The negative test (altered prefix) fails verification on an executed run.
- The positive test (clean append) passes.

---

## Worked Example

Input (illustrative): old size N=3, new size M=5.

```
proof nodes let verifier rebuild head@3 and head@5
assert rebuilt_head3 == anchored_head3 and rebuilt_head5 == published_head5
alter record seq=1 -> head3 mismatch -> INVALID (expected)
```

`consistency_proof_procedure` records the steps and PASS on both tests.

---

## Exit Criteria

DONE when `consistency_proof_procedure` generates a minimal proof tied to sizes N and M, verifies by recomputing both heads, and a negative altered-prefix test fails while a clean-append test passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Proof is sent without the sizes N and M | **Adjust**: attach both sizes; the proof cannot be checked without them. |
| Phase 2 | Altered-prefix negative test passes verification | **Stop**: the proof is not covering the first N leaves; fix node selection before use. |
| Phase 2 | Only the new head is checked | **Retry**: recompute and compare both the old and the new head, or a rewrite of the prefix goes undetected. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
