# Data Partnership Agreement

**One-line description:** A data provider and a data licensee each submit their real data specifications, use case requirements, and privacy constraints before formalizing a data agreement — Claude aligns on a licensing structure that gives the licensee what they actually need while protecting the provider's data asset and compliance posture.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both data provider and licensee must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_provider_and_licensee` (string, required): Data provider company and licensee company names.
- `shared_data_category` (string, required): Type of data — consumer, business, transactional, behavioral, location, health, financial, or other.

### Data Provider Submits Privately
- `provider_data_asset` (object, required): What data you have — attributes, volume, coverage, freshness, collection methodology, accuracy.
- `provider_licensing_economics` (object, required): Pricing model — subscription, per-record, revenue share, minimum commitments, what you need to make this worth licensing.
- `provider_use_case_restrictions` (object, required): What the data may and may not be used for — permitted uses, prohibited uses, competitive use restrictions.
- `provider_privacy_and_compliance_requirements` (object, required): PII handling requirements, consent framework, regulatory compliance (GDPR, CCPA), audit rights.
- `provider_concerns_about_this_licensee` (array, required): Data security posture, compliance history, competitive risk, use case creep.

### Licensee Submits Privately
- `licensee_use_case` (object, required): What you will do with the data — specific application, model training, analytics, product enrichment, targeting.
- `licensee_data_requirements` (object, required): Attributes needed, volume, refresh frequency, format, integration requirements — what you actually need vs. nice to have.
- `licensee_budget_and_pricing_tolerance` (object, required): Budget for data acquisition, pricing model preferences, what you are willing to pay.
- `licensee_compliance_and_security_posture` (object, required): Your data security program, privacy compliance infrastructure, how you handle licensed data.
- `licensee_concerns_about_this_provider` (array, required): Data quality, exclusivity concerns, pricing escalation, provider's own competitive positioning.

## Outputs
- `data_specification_alignment` (object): What data the licensee receives — attributes, volume, refresh, format.
- `licensing_economics` (object): Pricing model, fees, minimum commitments, payment structure.
- `use_case_and_restriction_framework` (object): Permitted uses, prohibited uses, competitive use provisions.
- `privacy_and_compliance_framework` (object): PII handling, consent, regulatory compliance, audit rights, breach notification.
- `data_quality_and_sla` (object): Accuracy standards, refresh cadence, issue resolution.
- `data_license_agreement_framework` (object): Key terms for legal review.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm provider's data asset description and licensee's use case both present.
**Output:** Readiness confirmation.
**Quality Gate:** Data asset and licensee use case both present with sufficient specificity to assess fit.

---

### Phase 1: Assess Data Fit and Compliance
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Evaluate licensee's use case against provider's data attributes — does the data actually support the use case? 2. Assess compliance requirements against licensee's privacy infrastructure. 3. Identify use case restrictions that affect what the licensee can do. 4. Evaluate competitive risk — does the licensee's use case create a competitive threat?
**Output:** Data fit assessment, compliance gap, use case restriction map, competitive risk assessment.
**Quality Gate:** Data fit assessment identifies specific attributes needed vs. what is available — not general fit.

---

### Phase 2: Structure the License
**Entry Criteria:** Fit assessed.
**Actions:** 1. Define the data specification — exactly what is licensed, in what format, at what refresh cadence. 2. Build the pricing structure — fees, minimums, escalation. 3. Define the use case permissions and prohibitions. 4. Establish the privacy and compliance framework.
**Output:** Data specification, pricing structure, use case framework, compliance requirements.
**Quality Gate:** Every use case permission is specific — not "analytics purposes" but named applications.

---

### Phase 3: Define Quality and Governance
**Entry Criteria:** License structured.
**Actions:** 1. Define data quality standards — accuracy, completeness, freshness — and what happens when they are not met. 2. Build the audit and audit response process. 3. Define breach notification and remediation obligations. 4. Assemble the agreement framework.
**Output:** Quality standards and SLA, audit process, breach obligations, agreement framework.
**Quality Gate:** Quality standards are specific metrics with specific remedies for non-compliance.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — data specification, licensing economics, use case framework, compliance requirements, quality SLA, agreement structure.
**Quality Gate:** Licensee knows exactly what they are receiving and what they can do with it. Provider knows the use case, restrictions, and compliance obligations.

---

## Exit Criteria
Done when: (1) data specification is complete, (2) pricing is specific, (3) use case permissions are named, (4) compliance requirements are defined, (5) quality SLA has specific metrics and remedies.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
