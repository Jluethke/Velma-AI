# Sports Sponsorship Deal

**One-line description:** The brand and the sports property each submit their real marketing objectives, asset valuations, and activation expectations — Claude designs a sponsorship structure that delivers measurable value for the brand and sustainable revenue for the property, without a deal that looks great on paper and dies in activation.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both brand and property must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_property_and_brand` (string, required): Sports property (team, event, athlete) and brand names.
- `shared_sponsorship_level` (string, required): Category or level under discussion.

### Brand Submits Privately
- `brand_marketing_objectives` (object, required): What business goals this sponsorship is meant to serve — awareness, purchase intent, B2B hospitality, employee engagement.
- `brand_budget_and_roi_expectations` (object, required): Budget available and what ROI or measurement framework you will use to evaluate the deal.
- `brand_activation_requirements` (object, required): What rights and assets you need to actually activate the sponsorship — IP, access, digital, experiential.
- `brand_concerns_about_the_property` (array, required): What worries you — audience alignment, delivery reliability, exclusivity, property's financial health?
- `brand_what_they_will_not_sign` (array, required): Terms, restrictions, or categories that make the deal unworkable.

### Sports Property Submits Privately
- `property_asset_package` (object, required): What is in the sponsorship — signage, IP rights, hospitality, digital, activations, player/athlete access.
- `property_valuation_and_asking_price` (object, required): How you value the package and what you are asking, with comparables if available.
- `property_exclusivity_and_category_position` (object, required): What exclusivity you can offer, what other brands are in adjacent categories, competitive conflicts.
- `property_activation_capacity` (object, required): What you can actually deliver in terms of activation support — staff, budget, time, co-promotion.
- `property_concerns_about_the_brand` (object, required): Fit risks — controversial products, competing partnerships, activation demands you cannot fulfill.

## Outputs
- `value_alignment_assessment` (object): Whether the asset package justifies the asking price given the brand's objectives.
- `sponsorship_package_design` (object): The specific rights and assets included — no ambiguity about what was bought.
- `activation_plan_framework` (object): How the sponsorship is activated — what the brand does, what the property supports.
- `measurement_and_roi_framework` (object): How success is measured, what data the property provides, what the renewal trigger is.
- `exclusivity_and_category_terms` (object): Exactly what is exclusive, what category definitions mean, how conflicts are handled.
- `sponsorship_agreement_framework` (object): Key terms for legal drafting.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm brand's objectives and property's asset package present.
**Output:** Readiness confirmation.
**Quality Gate:** Brand's marketing goals and property's sponsorship package both present.

---

### Phase 1: Assess Value Alignment
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess whether the asset package serves the brand's marketing objectives — are they buying what they need? 2. Evaluate the asking price against the brand's budget and ROI framework. 3. Check exclusivity — what the brand needs vs. what the property can actually protect. 4. Assess activation capacity — can the property support what the brand plans to do?
**Output:** Objective-package fit, price-value assessment, exclusivity feasibility, activation capacity.
**Quality Gate:** Value assessment is specific — "brand needs digital rights and B2B hospitality; package includes both; signage not prioritized by brand."

---

### Phase 2: Design the Package
**Entry Criteria:** Value assessed.
**Actions:** 1. Define the specific asset package — what is included, what is not, what has conditions. 2. Define exclusivity precisely — category definition, what brands are currently in adjacent categories, conflict handling. 3. Build the activation framework — what the property commits to support, what the brand is responsible for. 4. Define the measurement framework — data the property provides, metrics tracked.
**Output:** Specific asset package, exclusivity definition, activation framework, measurement framework.
**Quality Gate:** Asset package is specific — named assets, not "category sponsorship includes various benefits."

---

### Phase 3: Build the Agreement
**Entry Criteria:** Package designed.
**Actions:** 1. Define payment terms — timing, installments, what triggers payment. 2. Build the renewal and termination framework — option to renew, right of first refusal, what terminates the deal. 3. Define IP usage rights — what brand can do with property IP and vice versa. 4. Assemble the sponsorship agreement framework.
**Output:** Payment terms, renewal/termination, IP framework, agreement.
**Quality Gate:** Termination triggers are named — "property change in control, brand entering prohibited category, failure to deliver named assets."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present value alignment assessment. 2. Deliver sponsorship package design. 3. Deliver activation plan framework. 4. Deliver measurement and ROI framework. 5. Present exclusivity terms and agreement framework.
**Output:** Full synthesis — value, package, activation, measurement, exclusivity, agreement.
**Quality Gate:** Brand knows exactly what they bought. Property knows exactly what they committed to deliver.

---

## Exit Criteria
Done when: (1) package serves brand's objectives specifically, (2) exclusivity is defined precisely, (3) activation commitments are specific from both sides, (4) measurement framework is agreed, (5) agreement framework is complete.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
