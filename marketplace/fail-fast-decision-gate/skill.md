# Fail Fast Decision Gate

At each loop boundary decide proceed, redesign, or kill using the thresholds set during scoping, so iteration stops when learning stops.

## Inputs

- `iteration-finding`: The measured results and dominant mechanism from the loop
- `next-change`: The proposed next change and its predicted effect

## Outputs

- `gate-decision`: Proceed to the next maturity level, iterate within this level, or kill the concept, with the rationale tied to the pre-set thresholds
- `learning-ledger`: The running record of what each iteration cost, what it proved, and the remaining open questions carried to the next gate

## Process

1. Compare the finding to the three thresholds set during scoping: the pass line, the kill line, and the convergence rate. Proceed if above the pass line; kill if below the pre-set kill line; iterate only if between the two and still converging.
2. Measure convergence, not just level. If three loops moved the result 40%, 15%, 5%, the design is converging and one more loop is worth it. If they moved it 40%, 38%, 41%, you are oscillating around a limit the current concept cannot pass, and more iteration is waste.
3. Weigh the cost of the next loop against the value of the question it answers. A one-day loop that resolves a go/no-go decision is almost always worth running; a six-week loop that refines a number already inside margin is not.
4. Kill decisively and record why. A killed concept with a clear recorded reason is a program asset: it stops the team from re-proposing it in three months. Track the kill rate; a program that never kills a concept is not setting its gates honestly.
5. Update the learning ledger at every gate so the cost per lesson stays visible. When the marginal cost per lesson rises sharply across loops, the cheap learning is done and the program should move to the next maturity level or stop.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
