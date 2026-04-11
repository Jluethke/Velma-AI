# Restaurant Chef-Owner Alignment

**One-line description:** The chef and the owner each submit their real vision for the restaurant, financial constraints, and concerns — Claude finds where culinary ambition and business reality can coexist, and produces a menu and operating model both sides can commit to.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both chef and owner must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_restaurant_name` (string, required): Restaurant name.
- `shared_concept` (string, required): Restaurant concept and target customer.

### Chef Submits Privately
- `chef_culinary_vision` (string, required): What food do you want to cook? What is the story, the identity, the experience you are creating?
- `chef_menu_requirements` (object, required): Ingredients, techniques, sourcing standards, seasonality — what the menu needs to be authentic to your vision.
- `chef_concerns_about_financial_constraints` (array, required): What do you worry the owner will cut that you need — quality ingredients, kitchen equipment, staffing levels?
- `chef_what_they_need_to_do_their_job` (array, required): Prep time, kitchen layout, staff training, sourcing relationships — what must be true for the kitchen to function?
- `chef_what_is_non_negotiable` (array, required): What would cause you to leave — what compromises to food quality or kitchen integrity you will not accept?

### Owner Submits Privately
- `owner_financial_targets` (object, required): Target food cost percentage, labor cost, overall profitability — what the numbers need to look like.
- `owner_customer_expectations` (object, required): What your customers want — price points, portions, accessibility, dietary options — the market reality.
- `owner_concerns_about_the_menu` (array, required): What do you worry will not sell, will be too expensive, or will create operational complexity that breaks service?
- `owner_what_they_need_from_the_chef` (array, required): Consistency, cost discipline, team management, willingness to adapt — what you need from this chef beyond the cooking.
- `owner_constraints` (array, required): Budget limits, equipment limitations, staffing caps, supplier relationships — what the owner cannot change.

## Outputs
- `menu_viability_assessment` (object): Whether the chef's vision is financially viable as described, and what adjustments bring it into range.
- `food_cost_analysis` (object): Projected food cost for the proposed menu with the adjustments needed to hit target margins.
- `menu_design_framework` (object): The menu structure — number of items, categories, price points — that serves both vision and profitability.
- `non_negotiable_alignment` (object): What the chef must have and what the owner must have — where they overlap and where they conflict.
- `operating_model_agreement` (object): Kitchen staffing, prep workflow, sourcing standards — the operational commitments both sides are making.
- `conflict_resolution_process` (object): How ongoing disagreements about menu changes, cost, or quality are handled going forward.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm chef's culinary vision and owner's financial targets present.
**Output:** Readiness confirmation.
**Quality Gate:** Chef's menu requirements and owner's profitability targets both present.

---

### Phase 1: Assess Vision vs. Viability
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Assess the chef's vision against the owner's financial targets — what is the projected food cost and does it work? 2. Identify where the chef's requirements (ingredient quality, sourcing, technique) are the primary cost drivers. 3. Check the owner's customer expectations against the chef's intended experience — are they serving the same customer? 4. Identify the non-negotiable conflicts — what the chef must have vs. what the owner says no to.
**Output:** Financial viability assessment, cost driver map, customer alignment, conflict map.
**Quality Gate:** Food cost is projected specifically — "chef's stated sourcing standards produce an estimated 38% food cost; target is 30%; gap is 8 points concentrated in proteins and dairy."

---

### Phase 2: Design the Menu Framework
**Entry Criteria:** Viability assessed.
**Actions:** 1. Design the menu structure that balances vision and economics — anchors the experience in the chef's identity while using engineered menu design to protect margins. 2. Identify where ingredient substitutions or technique modifications can close the cost gap without destroying the culinary intent. 3. Define the sourcing standards — what must be premium vs. where quality tiers are acceptable. 4. Resolve the non-negotiable conflicts or name them as open issues for leadership to decide.
**Output:** Menu framework, cost-gap closure options, sourcing standards, non-negotiable resolution.
**Quality Gate:** Menu framework is specific — number of courses, price range, featured techniques, cost-engineered items identified.

---

### Phase 3: Build the Operating Agreement
**Entry Criteria:** Menu designed.
**Actions:** 1. Define kitchen staffing — roles, levels, and what the owner is committing to fund. 2. Build the sourcing and supplier framework — what relationships the chef needs and what the owner will support. 3. Define the menu change process — how seasonal changes, specials, and cost adjustments are handled going forward. 4. Build the conflict resolution process for ongoing disagreements about quality vs. cost.
**Output:** Staffing commitment, sourcing framework, menu change process, conflict resolution.
**Quality Gate:** Staffing commitment is specific — not "adequate staffing" but roles and counts. Conflict resolution has a named process, not "discuss as needed."

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Actions:** 1. Present menu viability assessment. 2. Deliver food cost analysis. 3. Deliver menu design framework. 4. Deliver non-negotiable alignment. 5. Present operating model agreement.
**Output:** Full synthesis — viability, food cost, menu framework, non-negotiables, operating model.
**Quality Gate:** Chef knows the financial constraints they are working within. Owner knows what they are getting and what they committed to provide.

---

## Exit Criteria
Done when: (1) food cost gap is identified and addressed, (2) menu framework is specific, (3) non-negotiables are resolved or named, (4) sourcing standards are defined, (5) operating model has specific commitments.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
