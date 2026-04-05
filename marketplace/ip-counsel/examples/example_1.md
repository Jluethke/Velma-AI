# Example: Patenting an Adaptive Governance Algorithm

A developer asks: "I built an adaptive governance algorithm that adjusts agent permissions based on trust scores. I want to patent it."

---

## Step 1: IP Inventory

Before drafting anything, scan for existing IP documents.

**Search results:**

```
Found: IP/patents/
  - Family_A_Adaptive_Governance_v2.docx (modified 2026-02-15)
  - Family_A_Reconciliation_Guide.docx (modified 2026-03-01)
  - Family_B_Trust_Computation.docx (modified 2026-01-20)

Found: governance/
  - governance_whitepaper.md (modified 2026-03-10)
```

**Inventory table:**

| Family | Document | Status | Claims | Date |
|--------|----------|--------|--------|------|
| A | Adaptive Governance v2 | Draft | 12 (3 independent) | 2026-02-15 |
| A | Reconciliation Guide | Reconciled | Overrides v1 claims 3-5 | 2026-03-01 |
| B | Trust Computation | Draft | 8 (2 independent) | 2026-01-20 |

**Finding:** Family A already covers adaptive governance. The developer's request would duplicate existing work.

**Action:** Review Family A drafts before generating anything new. The reconciliation guide supersedes earlier claim language.

---

## Step 2: Prior Art Search

Even though drafts exist, verify the prior art landscape is current.

```
Search 1:
  Source: Google Patents
  Query: "adaptive governance" AND "trust score" AND "agent permissions"
  Results: 47 patents found
  Closest: US11,234,567 — "Dynamic Permission Management in Multi-Agent Systems"
    Relevance: HIGH — covers trust-based permission adjustment
    Differentiation: Does not address real-time threshold calibration

Search 2:
  Source: arXiv
  Query: "multi-agent trust" "adaptive governance" "permission"
  Results: 12 papers
  Closest: arXiv:2025.12345 — "Trust-Aware Governance in Autonomous Agent Networks"
    Relevance: MEDIUM — theoretical framework, no implementation-level claims

Search 3:
  Source: GitHub
  Query: "trust score governance agent permissions"
  Results: 3 repositories with related functionality
  Closest: github.com/example/trust-governance (MIT license, 2024)
    Relevance: LOW — basic trust scoring without adaptive threshold calibration
```

**Finding:** US11,234,567 is the closest prior art. Family A's claims must clearly differentiate from this patent's dynamic permission management.

---

## Step 3: Gap Analysis

Compare drafts against the current codebase.

```
UNPROTECTED:
  - Real-time threshold calibration (new in codebase, not in any draft)
  - Multi-phase governance transitions (implemented but not claimed)

STALE:
  - Family A Claim 7 references "static trust tiers" — code now uses continuous scoring

CONTRADICTIONS:
  - Family A claims "trust computed from behavioral history"
  - Family B claims "trust computed from peer attestation"
  - Actual implementation uses BOTH — neither family captures the hybrid approach

TRADE SECRET CANDIDATES:
  - The specific calibration constants and decay rates (server-side, not visible)
```

---

## Step 4: Recommendations

1. **Do NOT generate new claims for adaptive governance** — Family A already covers it. Update Family A to address the hybrid trust computation.

2. **File a new claim for real-time threshold calibration** — this is genuinely novel (no prior art found covering automatic calibration of governance thresholds based on system telemetry).

3. **Reconcile Families A and B** — the hybrid trust computation (behavioral + attestation) should be claimed consistently.

4. **Keep calibration constants as a trade secret** — they are server-side, not reverse-engineerable, and the competitive advantage is in the specific values.

5. **Update Family A Claim 7** — "static trust tiers" no longer reflects the implementation.

---

## Step 5: Filing Checklist (for new threshold calibration claim)

- [x] Invention disclosure written
- [x] Prior art search completed
- [x] Closest prior art identified (US11,234,567)
- [ ] Claims drafted (independent + 3 dependent)
- [ ] Figures prepared (calibration loop flowchart)
- [ ] Applicant entity confirmed
- [ ] Provisional vs non-provisional decided
- [ ] Budget allocated

**Next action:** Draft claims for threshold calibration, then review with patent attorney before filing provisional ($300).

---

This example demonstrates the discipline: inventory first, then prior art, then gap analysis, then targeted recommendations. The developer thought they needed new claims for adaptive governance. They actually needed to update existing drafts and file on a genuinely novel sub-invention.
