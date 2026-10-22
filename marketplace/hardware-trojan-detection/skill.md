# Hardware Trojan Detection

Detect hardware trojans in ICs: golden-chip comparison, side-channel signature analysis, formal verification approaches, and IC protection through logic locking and split manufacturing.

## Inputs

- `inspection-results`: Counterfeit screening results (parts passed as genuine)
- `counterfeit-risk-verdict`: Risk assessment and evidence

## Outputs

- `trojan-analysis-results`: Trojan detection verdict: analysis methods applied, coverage, confidence level, any anomalies detected
- `ic-protection-design`: IP protection measures: logic locking scheme, split manufacturing plan, PUF-based authentication

## Process

1. Side-channel signature comparison: acquire power traces and electromagnetic signatures from the IC under test and compare to a reference (golden) chip that is known to be trojan-free. Statistical tests (principal component analysis, machine learning classifiers) detect added circuitry that causes deviations in power consumption or EM emissions. Limitation: small trojans (< 0.1% of die area) may be below detection threshold.
2. Logic testing: apply test vectors designed to activate potential trojans. Standard ATPG patterns cover stuck-at faults but not trojans (which may have rare trigger conditions). Supplement with random and constrained-random test patterns targeting low-controllability nodes. N-detect (apply N patterns that detect each fault) increases the probability of triggering a trojan's activation condition.
3. Formal verification: compare the gate-level netlist extracted from the IC (by reverse engineering the layout) to the reference design netlist. Equivalence checking identifies any added, removed, or modified gates. Practical only for smaller designs (< 100K gates) due to the cost of IC reverse engineering and the computational complexity of verification.
4. Logic locking: insert key-controlled gates (XOR, MUX) into the design netlist. The IC functions correctly only when the correct key is loaded (stored in tamper-proof memory on-chip). An adversary at the foundry sees the locked netlist but cannot determine the correct key. Key selection: use a SAT-attack-resistant locking scheme (Anti-SAT, SARLock) to resist oracle-guided attacks.
5. Split manufacturing: fabricate the front-end-of-line (transistors and lower metal layers) at one foundry and the back-end-of-line (upper metal routing) at a trusted facility. The untrusted foundry sees only partial connectivity, insufficient to understand or modify the circuit function. Combine with logic locking for defense-in-depth. PUF-based authentication: each legitimate IC generates a unique PUF response that is enrolled during trusted testing. In the field, verify the PUF response to authenticate the IC before trusting it.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
