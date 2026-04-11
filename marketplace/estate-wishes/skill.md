# Estate Wishes

**One-line description:** Parent and adult child each submit their real wishes, expectations, and fears about estate planning — Claude writes the conversation guide for the talk most families never have until it's too late.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both estate owner and beneficiary must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_family_context` (string, required): Brief family context, e.g., "Two adult children, spouse still living, family home and investment accounts."

### Estate Owner Submits Privately
- `owner_wishes` (object, required): What are your actual wishes? Assets, distribution, healthcare directives, burial preferences.
- `owner_reasoning` (string, required): The reasoning behind your decisions — especially anything that might surprise or hurt family members.
- `owner_fears_about_the_conversation` (string, required): What are you afraid will happen if you have this conversation?
- `owner_what_they_need_family_to_understand` (string, required): The one thing you most need them to understand about your wishes.
- `owner_non_negotiables` (array, required): What is not up for discussion?

### Beneficiary Submits Privately
- `beneficiary_expectations` (object, required): What do you expect or assume about the estate? Be honest.
- `beneficiary_concerns` (array, required): What concerns you about the estate situation or the conversation?
- `beneficiary_what_they_need_to_understand` (string, required): What do you need to know to feel okay about this?
- `beneficiary_fears_about_the_future` (string, required): What are you most afraid of in terms of what happens when the time comes?

## Outputs
- `alignment_map` (object): Where the owner's wishes match beneficiary expectations.
- `expectation_gaps` (array): Specific places where the beneficiary's assumptions differ from the owner's actual wishes.
- `conversation_guide` (object): How to have this conversation — what to say first, what to address, what to avoid.
- `legal_action_checklist` (array): The documents that need to exist — will, healthcare directive, POA, beneficiary designations — and which are missing or outdated.
- `family_communication_plan` (string): How to communicate the wishes to all relevant family members, not just the person in this session.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm `owner_wishes` and `beneficiary_expectations` present. Flag any non-negotiables from the owner that may conflict with beneficiary assumptions.
**Output:** Readiness confirmation.
**Quality Gate:** Both core fields present.

---

### Phase 1: Map Expectations vs. Reality
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare beneficiary expectations to owner's actual wishes item by item. 2. Identify where assumptions diverge. 3. Note the owner's reasoning — this is often what the beneficiary most needs to hear. 4. Extract both sides' fears.
**Output:** Expectation comparison, reasoning extraction, fear map.
**Quality Gate:** Every expectation gap is specific — "beneficiary assumes equal split; owner plans unequal distribution with reasoning X."

---

### Phase 2: Assess the Conversation Risks
**Entry Criteria:** Expectations mapped.
**Actions:** 1. Identify which gaps are likely to cause emotional distress when revealed. 2. Assess whether the owner's fears about the conversation are realistic. 3. Identify what the beneficiary needs to feel okay — and whether the owner's plan provides it. 4. Note missing legal documents.
**Output:** Emotional risk assessment, legal checklist, beneficiary needs assessment.
**Quality Gate:** Emotional risks named specifically. Legal checklist is exhaustive.

---

### Phase 3: Build the Conversation Guide
**Entry Criteria:** Risks assessed.
**Actions:** 1. Draft the opening of the conversation — what the owner could say to start it. 2. Build an agenda: start with the owner's intent and values, then move to specifics, then address questions. 3. Draft how to explain surprising or potentially painful decisions. 4. Identify what doesn't need to be in this conversation and can wait. 5. Recommend legal follow-up steps.
**Output:** Conversation guide with opening, agenda, and explanation framings. Legal follow-up list.
**Quality Gate:** Conversation guide addresses every significant expectation gap.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Guide built.
**Actions:** 1. Present alignment. 2. Present expectation gaps — named with context. 3. Deliver conversation guide. 4. Deliver legal checklist. 5. Close: "This conversation is a gift to the people you love. The hardest part is starting it."
**Output:** Full synthesis — alignment, gaps, conversation guide, legal checklist, family communication plan.
**Quality Gate:** Both sides understand what the conversation needs to cover. Owner has a path to starting it.

---

## Exit Criteria
Done when: (1) expectation gaps mapped specifically, (2) legal checklist complete, (3) conversation guide has opening, agenda, and framing for difficult items, (4) emotional risks addressed.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Owner's wishes include something likely to cause significant family conflict | Don't soften. Name the likely reaction and provide framing for how to explain the decision. |
| Phase 3 | Owner is unwilling to have this conversation at all | Provide a written alternatives: a letter to be opened after death, a recorded video, or a document left with the attorney. |

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
