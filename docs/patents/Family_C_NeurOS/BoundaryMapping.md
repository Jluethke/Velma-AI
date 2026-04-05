# IP BOUNDARY MAP

**Project:** NeurOS / NeuroFS (AI-Native Operating System Architecture)
**Patent Family:** C -- AI-Native Operating System with Resonant Cognition
**Owner:** The Wayfinder Trust
**Date:** 2026-02-13 (updated 2026-03-31)
**Classification:** Confidential -- Internal / NDA Use Only

---

## 1. PURPOSE

Define boundaries between patent-protected inventions, trade secrets, copyrighted works, and openly disclosed assets within the NeurOS/NeuroFS project.

- (a) Prevent accidental disclosure of protected IP
- (b) Preserve patent scope for AI-native OS architecture claims
- (c) Preserve trade secret status for parameterization, prompts, and domain-specific calibration
- (d) Clarify product-to-IP relationships across NeurOS, NeuroFS, and Governance subsystems
- (e) Guide publication, partnerships, and licensing decisions
- (f) Coordinate with Patent Families A (NeuroPRIN) and B (ALG)

All personnel with NeurOS access must consult this map before disclosure.

---

## 2. PATENT-COVERED ASSETS

Coverage extends to functional behavior, not code or numeric values.

### 2.1 Multi-Scale Tick Engine Architecture

**Covered by:** Patent Family C (Claims 1, 2, 3)

Includes:
- Central discrete-time event loop driving all OS subsystems
- Single-loop scheduling spanning millisecond tasks to longer cycles
- Per-tick pipeline: poll IPC, check completions, evaluate governance, dispatch tasks, collect results, emit snapshot
- Phase-aware dispatch varying behavior by system phase
- Resource-budgeted execution with lifecycle hooks

**Legal Status:** Patent-protected functional behavior

### 2.2 Self-Recursive Autonomy Loop

**Covered by:** Patent Family C (Claims 7, 10, 13)

Includes:
- Closed-loop cycle: goal -> exercise -> task -> execute -> learn -> goal
- Goal-driven exercise generation when queue is empty
- Reward-loop feedback linking outcomes to goal priorities
- Goal evolution triggered by accumulated learning progress
- Continuous operation without external prompting

**Legal Status:** Patent-protected autonomy architecture

### 2.3 PRIN-Based Agent Affinity Scoring

**Covered by:** Patent Family C (Claims 8, 9, 11)

Includes:
- Resonance-keyed task-to-agent scheduling
- Four-factor affinity: domain_match + performance + trust + availability
- EMA-smoothed agent trust from outcome history
- Resource-availability gating

**Legal Status:** Patent-protected scheduling mechanism

### 2.4 Cognitive Memory Architecture

**Covered by:** Patent Family C (Claims 19, 24, 25)

Includes:
- Six memory types: Episodic, Semantic, Knowledge Graph, Skill, Persona, Value-Tagged
- Governance-derived memory phases: ACTIVE, CONSOLIDATING, PROTECTED, ARCHIVED
- Importance levels: CRITICAL, HIGH, MEDIUM, LOW, EPHEMERAL
- Cross-store retrieval spanning all six types

**Legal Status:** Patent-protected cognitive architecture

### 2.5 Resonant Retrieval Algorithm

**Covered by:** Patent Family C (Claims 20, 23)

Includes:
- Four-dimensional scoring: similarity + recency + importance + value_index
- Temporal recency via exponential decay
- Value index: economic relevance, urgency, entropy
- Top-K retrieval sorted by composite resonance score

**Legal Status:** Patent-protected retrieval mechanism

### 2.6 Memory Consolidation with Importance Decay

**Covered by:** Patent Family C (Claims 21, 22)

Includes:
- Jaccard tag-similarity grouping (single-linkage clustering)
- Episodic-to-semantic conversion via group summarization
- Exponential decay with level-controlled multipliers
- Auto-archival below retention threshold

**Legal Status:** Patent-protected memory management mechanism

### 2.7 Embedded Governance Architecture

**Covered by:** Patent Family C + B jointly (Claims 26, 27, 28, 29, 30)

Includes:
- DomainAdapter pattern embedding governance at every layer
- System-domain adapter, memory-domain adapter
- Three-axis divergence: resource, performance, temporal
- Five-stage pipeline: Observe, Assess, Check, Modulate, Audit

**Legal Status:** Patent-protected governance integration

### 2.8 Kuramoto Multi-Instance Synchronization

**Covered by:** Patent Family C (Claims 17, 18)

Includes:
- Phase coupling across OS instances
- Order parameter coherence measurement
- Substrate-agnostic application

**Legal Status:** Patent-protected synchronization mechanism

---

## 3. TRADE SECRET ASSETS

### 3.1 Parameterization
- Specific tick intervals, EMA alphas, decay rates
- Resonance index weights
- Retrieval scoring weights
- Consolidation thresholds

**Legal Status:** Trade Secret -- Calibration

### 3.2 Prompt Engineering
- LLM prompt templates for intent parsing
- Training exercise generation prompts
- Cognitive core reasoning prompts

**Legal Status:** Trade Secret -- Prompt Engineering

### 3.3 Implementation Details
- Specific data structure layouts
- Performance optimization techniques
- Platform-specific adaptations

**Legal Status:** Trade Secret -- Implementation

---

## 4. COPYRIGHTED ASSETS

### 4.1 Source Code
- NeurOS core_kernel/, agent_stack/, knowledge/, governance/
- NeuroFS stores/, persistence/, management/

**Legal Status:** Copyright -- Software

---

## 5. CROSS-FAMILY RELATIONSHIPS

- **Family A (NeuroPRIN):** NeurOS can embed NeuroPRIN for actuation governance via DomainAdapter. Triple-layer governance claim (Claim 37).
- **Family B (ALG):** NeurOS embeds ALG five-stage pipeline at every layer via DomainAdapter interface. Core governance mechanism.
- **Family D (Bridges):** Bridges provide cross-subsystem coordination for NeurOS instances.
- **Family F (SkillChain):** SkillChain provides decentralized skill validation for the NeurOS skill library store.

---

*Classification: CONFIDENTIAL -- Internal / NDA Use Only*
*Owner: The Wayfinder Trust*
