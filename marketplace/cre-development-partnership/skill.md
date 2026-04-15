# CRE Development Partnership

**One-line description:** Developer and capital partner each submit their real return requirements and control needs before structuring a JV — AI models the waterfall, surfaces governance conflicts, and produces a term sheet framework both sides can negotiate from.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both developer and capital partner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_project_name` (string, required): Project name.
- `shared_project_summary` (string, required): Project description — type, size, location, phase of development.

### Developer / Operating Partner Submits Privately
- `developer_project_vision` (string, required): What is the development thesis? What are you building and why now?
- `developer_return_expectations` (object, required): What returns are you underwriting? What is the promote structure you are seeking?
- `developer_what_they_bring` (array, required): What is the developer contributing — land, entitlements, relationships, construction expertise, market knowledge?
- `developer_control_requirements` (array, required): What decisions must remain with the developer? What is non-negotiable?
- `developer_concerns_about_capital_partner` (array, required): What do you worry about bringing in a capital partner?

### Capital Partner / Equity Investor Submits Privately
- `capital_return_requirements` (object, required): Minimum preferred return, target IRR, equity multiple, and investment horizon.
- `capital_risk_tolerances` (object, required): What are you willing to underwrite — entitlement risk, lease-up risk, construction cost risk?
- `capital_governance_requirements` (array, required): What major decisions require LP approval? What reporting do you need?
- `capital_exit_expectations` (object, required): Target hold period, exit strategy, and what triggers a forced sale.
- `capital_concerns_about_developer` (array, required): What concerns you about this developer or deal?

## Outputs
- `economics_alignment` (object): Whether both sides' return requirements are compatible in the same deal.
- `governance_structure_options` (array): 2-3 governance models with decision rights and LP protections.
- `waterfall_model` (object): Modeled distribution waterfall showing economics at various return scenarios.
- `control_and_decision_rights_map` (object): Who controls what — developer vs. LP approvals at each decision type.
- `jv_term_sheet_draft` (string): Key deal terms — economics, governance, capital calls, reporting, exit provisions.
- `risk_allocation_summary` (object): How project risks are allocated between developer and capital partner.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm return requirements and developer contributions present.
**Output:** Readiness confirmation.
**Quality Gate:** Capital partner's return requirements and developer's promote expectations both present.

---

### Phase 1: Test Economic Compatibility
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Model the distribution waterfall with developer's requested promote against capital partner's required preferred return and target IRR. 2. Check whether the deal economics can satisfy both sides' return requirements at the projected returns. 3. Identify what the project needs to achieve for both sides to hit their targets. 4. Stress-test the economics at 20% below projection — do both sides still meet minimum requirements?
**Output:** Waterfall model, return compatibility assessment, minimum viable project performance, stress test.
**Quality Gate:** Economic compatibility is stated in numbers — "at a 15% project-level return, the developer achieves X and the capital partner achieves Y."

---

### Phase 2: Map Governance Conflicts
**Entry Criteria:** Economics tested.
**Actions:** 1. Compare developer's control requirements against capital partner's governance requirements — identify every conflict. 2. Identify decision types where control is ambiguous (major contracts, leasing decisions, refinancing, entitlement changes). 3. Assess capital partner's risk tolerances against the project's actual risk profile — what is the LP underwriting vs. what the project actually exposes them to? 4. Identify exit expectation conflicts — different hold periods or exit strategies.
**Output:** Governance conflict map, ambiguous decision types, risk tolerance vs. actual risk, exit conflict.
**Quality Gate:** Every governance conflict is named — "developer needs unilateral control over X, LP requires approval for X" not "there may be some governance questions."

---

### Phase 3: Build the Term Sheet
**Entry Criteria:** Conflicts mapped.
**Actions:** 1. Design governance structure options that address both sides' core requirements. 2. Draft the distribution waterfall with preferred return, pari-passu equity return, and promote structure. 3. Draft major deal terms: equity contributions, capital call provisions, construction management fee, asset management fee, disposition fee, reporting requirements, forced sale provisions. 4. Draft risk allocation — who bears construction cost overruns, lease-up shortfalls, entitlement delays.
**Output:** JV term sheet draft, governance structure options, risk allocation summary.
**Quality Gate:** Term sheet is specific enough to negotiate from. Governance options reflect real choices, not minor variations.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Term sheet drafted.
**Actions:** 1. Present economics alignment with waterfall model. 2. Present governance conflict map. 3. Deliver governance structure options. 4. Deliver JV term sheet draft. 5. Present risk allocation summary.
**Output:** Full synthesis — economics, waterfall, governance conflicts, governance options, term sheet, risk allocation.
**Quality Gate:** Both sides understand the economics they are agreeing to and the governance rights they are trading.

---

## Exit Criteria
Done when: (1) waterfall modeled at projected and stress-test returns, (2) every governance conflict named, (3) governance structure options represent real choices, (4) term sheet covers economics, governance, fees, reporting, and exit, (5) risk allocation explicit.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
