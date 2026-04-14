# IP Licensing Prospect

Identifies and profiles the right decision-maker at a target company for an IP licensing conversation, maps how the decision flows internally, selects the strongest entry point, and produces everything needed to go from cold to meeting.

**Why this exists:** Most licensing outreach fails at step one — wrong person, wrong frame, wrong timing. This skill fixes all three before a single message is sent.

**Core principle:** Never contact a target before you know who initiates the decision, who blocks it, who signs it, and what keeps them up at night. The outreach is the last step, not the first.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ROLE TARGETING      --> Define who matters before who they are
PHASE 2: PEOPLE RESOLUTION   --> Turn roles → real humans with backgrounds and priorities
PHASE 3: DECISION MAPPING    --> Understand how the decision flows, who blocks, who signs
PHASE 4: ENTRY POINT         --> Choose who to contact first and why
```

## Inputs

- `target_company`: string -- Company name (e.g., "Coalition Insurance")
- `sector`: string -- Industry sector (e.g., "cyber insurance", "autonomous vehicles", "humanoid robotics")
- `patent_families`: list[object] -- Patent families being licensed. Each: `{family, title, what_it_covers, market_application}`
- `licensor_name`: string -- Licensing entity (e.g., "Northstar Systems Group")
- `licensor_context`: string -- One paragraph: what was built, what the IP covers, why it matters now
- `deal_structure`: object -- `{type, upfront_range, royalty_rate, field_of_use}`
- `urgency_driver`: string -- (Optional) What's creating pressure for them right now

## Outputs

- `role_stack`: list[object] -- Prioritized executive roles ranked by decision influence: `{role, why_they_matter, influence_level}`
- `people_list`: list[object] -- Real humans behind those roles: `{name, title, background, likely_priorities, linkedin_url}`
- `decision_map`: object -- How the decision flows: `{initiator, champion, blocker, approver, signer}` with rationale
- `entry_strategy`: object -- Recommended first contact with tradeoffs for each option: `{recommended, rationale, alternatives}`
- `risk_surface`: object -- Specific Family A/B exposure at this company: the system, the gap, the consequence
- `outreach_notes`: object -- Tone, what NOT to say, warm intro paths, recommended channel and timing

---

## Execution

### Phase 1: ROLE TARGETING

**Entry criteria:** `target_company` and `sector` provided.

**Actions:**

1. **Define the role stack.** For the target sector, identify which executive roles are most likely to own the decision to license AI governance infrastructure. Standard priority order:

   | Sector | Primary | Secondary | Tertiary |
   |---|---|---|---|
   | Insurance | Chief Risk Officer | General Counsel | Chief Actuary |
   | Autonomous Vehicles | Chief Safety Officer | General Counsel | CTO |
   | Robotics | CTO / Head of AI | Chief Safety Officer | CEO |
   | Financial AI | Chief Risk Officer | Head of Quant / Data Science | GC |
   | Medical AI | Chief Medical Officer | VP Regulatory Affairs | GC |
   | Defense | VP Engineering | Chief Systems Engineer | BD / Contracts |

2. **Assess influence by deal angle.** Rank roles by who:
   - **Feels the pain first** (CRO feels regulatory risk before anyone else)
   - **Can say yes without escalation** (GC can approve a license deal under a threshold)
   - **Can block it** (Legal, Finance, or Procurement can kill it without being the champion)
   - **Has to sign it** (CEO, CFO, or Board for larger deals)

3. **Output the prioritized role stack** with explanation for each.

**Output:** `role_stack`
**Quality gate:** At least 3 roles identified with ranked influence. Role ranking is justified by deal type, not generic seniority.

---

### Phase 2: PEOPLE RESOLUTION

**Entry criteria:** Role stack complete.

**Actions:**

1. **Find the actual people.** For each role in the stack, search:
   - Company leadership page and About section
   - LinkedIn (search "[Company] + [Role Title]")
   - Crunchbase (team section)
   - Press releases announcing executive hires
   - Conference speaker lists (RSA, InsureTech Connect, NeurIPS, etc.)
   - Published interviews, podcasts, bylined articles

2. **Build a profile for each person found.** Record:
   - Full name and exact title
   - Career background (where they came from, what they've built before)
   - Likely priorities based on their background and current role
   - Any public statements about AI, risk, compliance, or governance
   - LinkedIn URL and whether they post actively
   - Any shared connections, investors, advisors, or alumni networks

3. **Flag warm intro paths.** Check for:
   - Shared investors between licensor and target
   - Shared advisors or board members
   - Conference co-appearance
   - Alumni networks (same university, same prior employer)
   - Mutual LinkedIn connections

4. **Limit to 2–4 names maximum.** More than 4 is noise. Focus on who can move.

**Output:** `people_list`
**Quality gate:** Each person has a name, title, at least one priority identified, and at least one reachability method. Warm intro paths are flagged explicitly.

---

### Phase 3: DECISION MAPPING

**Entry criteria:** People identified.

**Actions:**

1. **Map the decision flow.** For a deal of this type (IP license, compliance infrastructure, $2-5M), determine:
   - **Who initiates?** Who first recognizes the need and puts it on the agenda (typically CRO or GC)
   - **Who champions?** Who sponsors the deal internally once interested (the person you convert in step 9)
   - **Who blocks?** Who can kill it without being the buyer — Legal (IP review), Finance (budget), Procurement (vendor process), IT (integration)
   - **Who approves?** Who has budget authority at this deal size
   - **Who signs?** The final signatory (often CEO, COO, or GC depending on company size)

2. **Identify the blocking layer.** The most common deal-killers for IP licensing at this stage:
   - Legal says "we need to build this in-house" → Address: the patent covers the mechanism
   - Finance says "not in this year's budget" → Address: license fee can be structured as multi-year
   - Procurement says "we have a vendor process" → Address: IP licensing is not a typical vendor engagement
   - Engineering says "we already have this" → Address: do they? What audit trail do they have?

3. **Map the timeline.** Estimate deal velocity:
   - Fast (< 60 days): CRO or GC has been thinking about this, budget exists, urgency is high
   - Normal (60-120 days): Genuine interest but requires internal selling
   - Slow (> 120 days): Requires board-level approval or procurement process

**Output:** `decision_map`
**Quality gate:** Initiator, champion, blocker, approver, and signer are each identified with a named role. Blocking layer is addressed with a specific counter.

---

### Phase 4: ENTRY POINT SELECTION

**Entry criteria:** Decision map complete.

**Actions:**

1. **Evaluate three entry strategies:**

   **Option A — High Power (CRO first):**
   - Pros: Feels the pain directly, can initiate internally, risk management is their job
   - Cons: May not have budget authority alone, will route to GC and Finance
   - Best when: Regulatory pressure is acute and recent

   **Option B — Legal Pressure (GC first):**
   - Pros: Can approve the deal structure, understands IP, lower resistance to licensing conversations
   - Cons: May not feel the urgency unless CRO has already raised it
   - Best when: A specific regulatory filing or enforcement action is imminent

   **Option C — Warm Path (mutual connection first):**
   - Pros: Highest response rate, pre-qualified trust
   - Cons: Depends on network, takes longer to initiate
   - Best when: A warm intro is available and the deal can afford a 2-week delay

2. **Recommend one entry point with clear rationale.** Don't hedge — pick one and explain why.

3. **Define the fallback.** If primary doesn't respond in 10 days, who is the pivot?

**Output:** `entry_strategy` and `risk_surface` and `outreach_notes`
**Quality gate:** One entry point recommended with specific rationale tied to this company's situation. Fallback defined.

---

## Exit Criteria

The skill is DONE when:
1. Role stack is ranked with influence reasoning
2. 2-4 real people are identified with profiles
3. Decision flow is mapped (initiator → champion → blocker → approver → signer)
4. One entry point is selected with rationale and fallback defined
5. Risk surface names the specific system and specific regulatory gap
6. Outreach notes include what NOT to say

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| ROLE TARGETING | Sector doesn't match standard role map | Adjust — infer from company's publicly stated org structure |
| PEOPLE RESOLUTION | No named executives found publicly | Adjust — output role-based targeting with LinkedIn search instructions |
| PEOPLE RESOLUTION | No warm intro path exists | Adjust — recommend conference targeting strategy with specific upcoming events |
| DECISION MAPPING | Company is pre-Series B (flat org) | Adjust — CEO is initiator, approver, and signer; map accordingly |
| ENTRY POINT | Multiple equally strong options | Output all three with recommendation and conditions under which to switch |

## State Persistence

- `target_registry`: All companies researched — name, contact found, outreach status, response
- `contact_history`: Named contacts, role, response status, relationship notes
- `objection_library`: Objections encountered with tested responses, improves across deals
- `sector_intelligence`: Regulatory updates and market signals by sector, informs targeting
- `warm_intro_map`: Known shared connections across all targets

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
