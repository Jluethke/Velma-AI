# Media Content Licensing

**One-line description:** Content owner and licensee each submit their real deal requirements, exclusivity needs, and financial expectations — Claude designs the license structure that protects the content's value while making the deal commercially workable for the platform or distributor.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both content owner and licensee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_content_description` (string, required): What content is being licensed — title, format, type.
- `shared_license_territory` (string, required): Geographic scope of the license.

### Content Owner Submits Privately
- `owner_content_value_and_comparables` (object, required): How you value this content and what comparable deals look like.
- `owner_exclusivity_position` (string, required): What exclusivity are you willing to grant, for how long, and at what price premium?
- `owner_rights_they_will_not_grant` (array, required): Rights you are withholding — derivative works, format changes, sublicensing, certain platforms.
- `owner_concerns_about_the_licensee` (array, required): What worries you — how they will use the content, whether they will pay, brand alignment?
- `owner_performance_requirements` (object, required): Minimum guarantees, distribution commitments, marketing spend — what must the licensee do with this content?

### Licensee Submits Privately
- `licensee_business_case_for_this_content` (object, required): Why this content, for what platform or use, and what is the revenue model?
- `licensee_what_rights_they_need` (object, required): Distribution rights, platform exclusivity, format rights, sublicensing — what the business model requires.
- `licensee_financial_terms_they_can_support` (object, required): What you can pay — upfront guarantee, royalty rate, minimum guarantee — and what the content's value is in your model.
- `licensee_concerns_about_content_restrictions` (array, required): What owner restrictions create business model problems?
- `licensee_performance_capacity` (object, required): What distribution, marketing, and minimum performance you can actually commit to.

## Outputs
- `rights_alignment_assessment` (object): What rights the owner will grant vs. what the licensee needs — where there is alignment and where there are gaps.
- `financial_term_design` (object): License fee structure — upfront guarantee, royalty rate, MG — that works for both parties.
- `exclusivity_and_term_structure` (object): Exclusivity scope, duration, carve-outs, and what the owner retains.
- `performance_obligations` (object): What the licensee must do — distribution commitments, marketing, reporting.
- `license_agreement_framework` (object): Key terms ready for legal drafting — rights granted, restrictions, term, fees, performance, termination.
- `brand_and_quality_controls` (object): How the content is used, presented, and protected in the licensee's platform.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm content owner's terms and licensee's rights needs present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's rights position and licensee's business case both present.

---

### Phase 1: Assess Rights and Commercial Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Map what rights the licensee needs against what the owner will grant — identify gaps. 2. Compare owner's financial expectations against licensee's stated capacity — is there a commercial deal? 3. Assess exclusivity alignment — what the licensee needs vs. what the owner is willing to lock up. 4. Check performance requirements against what the licensee can actually commit to.
**Output:** Rights gap map, financial viability, exclusivity alignment, performance feasibility.
**Quality Gate:** Rights gaps are specific — "licensee needs sublicensing rights for white-label partners; owner will not grant; alternative is direct license to named sub-licensees."

---

### Phase 2: Design the License Structure
**Entry Criteria:** Alignment assessed.
**Actions:** 1. Design the rights package — what is granted, what is withheld, what has conditions. 2. Build the financial structure — minimum guarantee, royalty rate, payment schedule, audit rights. 3. Define exclusivity — scope, territory, duration, carve-outs the owner retains (e.g., direct sales, certain platforms). 4. Define performance obligations — what the licensee commits to and what the remedy is for non-performance.
**Output:** Rights package, financial structure, exclusivity definition, performance obligations.
**Quality Gate:** Exclusivity definition is specific — territory, platform, format, duration, and what is NOT exclusive are all named.

---

### Phase 3: Build the Agreement Framework
**Entry Criteria:** Structure designed.
**Actions:** 1. Assemble the license agreement framework — rights granted, territory, term, fee, royalties, performance, termination. 2. Define brand and quality controls — how the content is presented, what modifications are permitted. 3. Build the reporting and audit framework — how royalties are reported and verified. 4. Define termination rights — what triggers termination and what happens to the content on termination.
**Output:** Agreement framework, brand controls, reporting structure, termination rights.
**Quality Gate:** Framework is specific enough to draft an agreement from. Termination triggers are named, not "material breach."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Framework built.
**Actions:** 1. Present rights alignment assessment. 2. Deliver financial term design. 3. Deliver exclusivity and term structure. 4. Deliver performance obligations. 5. Present license agreement framework.
**Output:** Full synthesis — rights, financials, exclusivity, performance, agreement framework.
**Quality Gate:** Both parties have a shared understanding of the deal before attorneys begin drafting.

---

## Exit Criteria
Done when: (1) rights gaps are resolved or named as deal conditions, (2) financial structure is specific, (3) exclusivity is defined with carve-outs, (4) performance obligations are measurable, (5) agreement framework is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
