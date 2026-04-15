# Sports Team Player Contract

**One-line description:** A sports team and a player (or their representation) each submit their real valuation, role expectations, and contract priorities before negotiating — AI aligns on a contract structure that reflects the player's contribution and the team's roster strategy without the adversarial dynamic that poisons the relationship before it starts.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both team and player must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_team_and_player` (string, required): Team name and player name.
- `shared_sport_and_position` (string, required): Sport, position, and league level.

### Team Submits Privately
- `team_valuation_of_player` (object, required): Your honest assessment of the player's value — contract offer range, years, structure, what comparable players are earning.
- `team_roster_and_role_plan` (object, required): How this player fits the roster — starting role, depth role, development investment, what the team needs from this player.
- `team_contract_structure_requirements` (object, required): Guaranteed money vs. incentive structure, length, what the team can and cannot offer.
- `team_concerns_about_this_player` (array, required): Injury history, performance trajectory, locker room fit, contract demands vs. performance.
- `team_what_they_will_not_offer` (array, required): Contract terms, guarantees, or role commitments you will not provide.

### Player Submits Privately
- `player_self_assessment` (object, required): How you honestly assess your own value — what you have proven, what you believe you will become, what you deserve to earn.
- `player_contract_priorities` (object, required): What matters most — guaranteed money, total value, length, role commitment, market, team quality.
- `player_career_goals` (object, required): What you want from this stage of your career — starting opportunity, championship, development, financial security.
- `player_concerns_about_this_team` (array, required): Playing time, coaching fit, team direction, injury risk, whether this team will use you correctly.
- `player_deal_breakers` (array, required): Terms or conditions that would cause you to reject the offer.

## Outputs
- `valuation_alignment` (object): Where team and player valuations align and where the gap is — with comparables.
- `contract_structure_recommendation` (object): Recommended contract terms — length, total value, guarantees, incentives.
- `role_and_development_framework` (object): What role the player is being offered and what the team is committing to.
- `negotiation_gap_and_bridge` (object): What needs to move for a deal to happen — specific adjustments.
- `career_fit_assessment` (object): Whether this team fits the player's career goals and vice versa.
- `contract_term_framework` (object): Key contract provisions for player agents and team legal teams.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm team's valuation and contract parameters and player's contract priorities both present.
**Output:** Readiness confirmation.
**Quality Gate:** Both parties' valuation and contract priorities present.

---

### Phase 1: Assess Value and Fit
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Compare team's valuation against player's self-assessment — what is the gap? 2. Assess role fit against player's career goals. 3. Evaluate comparable contracts to anchor the negotiation. 4. Identify the specific terms where compromise is possible.
**Output:** Valuation gap with comparables, role fit assessment, negotiable term map.
**Quality Gate:** Valuation gap is a specific dollar amount with named comparables supporting each party's position.

---

### Phase 2: Build the Contract Framework
**Entry Criteria:** Assessment complete.
**Actions:** 1. Define the contract structure — length, total value, guarantee split, incentives. 2. Define the role commitment — what the team is offering and what it is not. 3. Identify bridge terms — what adjustments close the gap. 4. Assess deal-breakers against what is available.
**Output:** Contract structure, role commitment, bridge terms, deal-breaker assessment.
**Quality Gate:** Bridge terms are specific adjustments with specific dollar or structural impact — not vague compromises.

---

### Phase 3: Address Fit and Career Assessment
**Entry Criteria:** Framework built.
**Actions:** 1. Assess career fit honestly — is this the right team for this player at this stage? 2. Define the protection provisions — what happens on injury, role change, trade. 3. Define the no-trade and no-cut provisions if applicable. 4. Assemble the contract framework for agents and legal teams.
**Output:** Career fit assessment, protection provisions, no-trade/no-cut analysis, contract framework.
**Quality Gate:** Protection provisions address specific scenarios — named situations with specific contract consequences.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Agreement built.
**Output:** Full synthesis — valuation alignment, contract structure, role commitment, bridge terms, career fit, protection provisions, contract framework.
**Quality Gate:** Player knows the deal on the table and what it means for their career. Team knows what the player needs and what they can offer.

---

## Exit Criteria
Done when: (1) valuation gap is quantified with comparables, (2) contract structure is specific, (3) role commitment is defined, (4) bridge terms are identified, (5) protection provisions are addressed.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
