# FORMAL PATENT CLAIM SET

**Family B: Assured Learning Governor -- Runtime Governance of Adaptive Systems**

**Title:** Runtime Trust-Based Governance System for Safety-Critical Adaptive Systems

**Applicant:** The Wayfinder Trust
**Inventor:** Jonathan Luethke
**Status:** READY FOR FILING
**Date:** March 2026

**Related Families:** Patent Family A (Runtime Actuation Governance), Patent Family D (Cross-Subsystem Governance Coordination), Patent Family F (Cognitive Memory Governance), Patent Family G (Agent Swarm Governance)

---

## CLAIMS

### Independent System Claim

**1.** A computing system for runtime governance of adaptive learning systems, comprising:

   a processor; and

   a non-transitory computer-readable memory storing instructions that, when executed by the processor, implement:

   a) an observation module configured to receive, from a domain adapter interface, a plurality of divergence measurements across a configurable number of measurement axes, wherein each axis quantifies deviation between a current operational state and a validated reference state along a respective dimension;

   b) an assessment module configured to compute a combined divergence value as a weighted aggregate of the plurality of divergence measurements and to compute a trust value by applying an exponential decay function to said combined divergence value, the trust value being smoothed by an exponential moving average function, wherein the trust value is bounded within a closed interval from zero to one;

   c) an anticipation module configured to project the trust value forward over a configurable number of future evaluation steps using divergence trend extrapolation to produce a projected trust value, and to compare the projected trust value against crisis records stored in a crisis memory bank using a vector similarity function to identify recurring failure patterns;

   d) a modulation module configured to map the trust value to an authority constraint via linear interpolation between phase-specific authority levels defined by configurable phase thresholds, wherein the authority constraint determines a scaling factor applied to proposed operational modifications, and wherein the scaling factor is bounded within a closed interval from zero to one such that the system can only attenuate or block proposed modifications and cannot amplify them;

   e) an enforcement module configured to apply the authority constraint to proposed operational modifications and, when the trust value falls below a configurable rollback threshold, to restore both an internal governance state and a domain-specific external state to a prior validated snapshot; and

   f) an audit module configured to produce, at each governance evaluation step, a governance record comprising at least the combined divergence value, the trust value, the authority constraint, and a governance action, and to generate a tamper-evident chain by computing a collision-resistant cryptographic hash of each governance record together with a cryptographic hash of an immediately preceding governance record;

   wherein the system governs operational modifications independently of any specific domain implementation through said domain adapter interface, and wherein the enforcement module prevents unbounded or unsafe modifications when the trust value indicates unsafe conditions.

---

### Independent Method Claim

**2.** A method for governing an adaptive system at runtime, the method comprising:

   a) observing, via a domain adapter interface, a plurality of divergence measurements across a configurable number of measurement axes, wherein each axis quantifies deviation between a current operational state and a validated reference state along a respective dimension;

   b) computing a combined divergence value as a weighted aggregate of the plurality of divergence measurements;

   c) computing a trust value by applying an exponential decay function to said combined divergence value, wherein the trust value is produced by a formula:

      raw trust equals the exponential function of the negative product of a configurable decay gain and the combined divergence value,

      smoothed trust equals the product of an exponential moving average coefficient and the raw trust, plus the product of one minus said coefficient and a prior smoothed trust value,

      and wherein the resulting trust value is clamped to a closed interval from zero to one;

   d) projecting the trust value forward over a configurable number of future evaluation steps by extrapolating a divergence trend, and comparing the projected trust trajectory against crisis records stored in a crisis memory bank to identify recurring failure patterns;

   e) mapping the trust value to an authority constraint via linear interpolation between phase-specific authority levels, wherein the authority constraint determines a scaling factor bounded within a closed interval from zero to one;

   f) applying the authority constraint to proposed operational modifications such that no proposed modification is amplified beyond its original magnitude;

   g) when the trust value falls below a configurable rollback threshold, restoring both an internal governance state and a domain-specific external state to a prior validated snapshot; and

   h) recording each governance decision in a tamper-evident chain by computing a collision-resistant cryptographic hash of each governance record together with a cryptographic hash of an immediately preceding governance record.

---

### Independent Computer-Readable Medium Claim

**3.** A non-transitory computer-readable medium storing instructions that, when executed by a processor, cause the processor to:

   a) receive, from a domain adapter interface, a plurality of divergence measurements across a configurable number of measurement axes, wherein each axis quantifies deviation between a current operational state and a validated reference state along a respective dimension;

   b) compute a combined divergence value as a weighted aggregate of the plurality of divergence measurements;

   c) compute a trust value by applying an exponential decay function to said combined divergence value, the trust value being smoothed by an exponential moving average function, wherein the trust value is bounded within a closed interval from zero to one;

   d) project the trust value forward over a configurable number of future evaluation steps using divergence trend extrapolation to produce a projected trust value, and compare the projected trust value against crisis records stored in a crisis memory bank using a vector similarity function;

   e) map the trust value to an authority constraint via linear interpolation between phase-specific authority levels defined by configurable phase thresholds, the authority constraint determining a scaling factor bounded within a closed interval from zero to one;

   f) apply the authority constraint to proposed operational modifications such that no proposed modification is amplified;

   g) when the trust value falls below a configurable rollback threshold, restore both an internal governance state and a domain-specific external state to a prior validated snapshot; and

   h) record each governance decision in a tamper-evident chain by computing a collision-resistant cryptographic hash of each governance record together with a cryptographic hash of an immediately preceding governance record.

---

### Dependent Claims -- Divergence Monitoring

**4.** The system of claim 1, wherein the observation module monitors divergence across N configurable measurement axes, wherein N is an integer greater than or equal to two, and wherein the measurement axes include at least a resource-utilization axis and a performance axis, and may further include a temporal axis computed from a rate of change of the combined divergence value over a sliding window of prior evaluation steps.

**5.** The system of claim 4, wherein each measurement axis has an associated configurable weight, and the combined divergence value is computed as a weighted sum of the individual axis values, and wherein the temporal axis value is computed using exponentially-weighted first differences of the combined divergence history.

**6.** The method of claim 2, wherein the plurality of divergence measurements includes a temporal divergence computed as an exponentially-weighted rate of change of the combined divergence value, such that positive temporal divergence indicates worsening conditions and negative temporal divergence indicates improving conditions.

---

### Dependent Claims -- Trust Computation

**7.** The system of claim 1, wherein the trust value exhibits asymmetric dynamics such that trust decays at a first rate when divergence increases and recovers at a second rate when divergence decreases, and wherein the ratio of the first rate to the second rate is a configurable asymmetric decay-to-recovery ratio greater than one.

**8.** The method of claim 2, wherein the exponential moving average coefficient is selected to preserve a consistent effective time constant across different observation intervals, such that a governance behavior of the system is invariant to a frequency at which an evaluation step is invoked.

**9.** The system of claim 1, wherein the assessment module is further configured to receive a post-trust adjustment from a configurable callback function that modifies the smoothed trust value based on domain-specific criteria, wherein said callback function can only decrease or maintain the trust value and cannot increase it beyond the smoothed value.

---

### Dependent Claims -- Trust Horizon and Predictive Governance

**10.** The system of claim 1, wherein the anticipation module computes a projected trust value by:

   a) maintaining an exponentially-smoothed slope of the combined divergence value over successive evaluation steps;

   b) extrapolating the combined divergence value forward by a configurable number of steps using said slope; and

   c) computing the projected trust value by applying the exponential decay function to the extrapolated divergence value;

   wherein the anticipation module constrains authority preemptively when the projected trust value falls within a configurable proximity of the rollback threshold, and wherein the anticipation module only constrains and never amplifies authority.

**11.** The system of claim 1, wherein the crisis memory bank stores a bounded number of crisis records, each crisis record comprising a divergence signature capturing the divergence measurement values across all axes at a time of a governance crisis, a minimum trust value reached during the governance crisis, a trust drop magnitude, and an elapsed interval since a preceding crisis, and wherein each crisis record is linked to the preceding crisis record via a collision-resistant cryptographic hash to form a tamper-evident crisis ledger.

**12.** The system of claim 11, wherein the anticipation module identifies recurring failure patterns by computing a vector similarity measure between a current divergence measurement vector and each stored crisis divergence signature, and wherein a match is identified when the similarity measure exceeds a configurable similarity threshold.

**13.** The method of claim 2, further comprising entering a post-crisis probation period following each governance crisis, during which the authority constraint is reduced by a configurable factor, and wherein a duration of the post-crisis probation period is a function of both a severity of the governance crisis and a number of similar prior crises identified via the vector similarity function.

---

### Dependent Claims -- Authority Gate and Phase Management

**14.** The system of claim 1, wherein the modulation module maps the trust value to authority via linear interpolation within each phase, such that authority transitions smoothly and continuously between adjacent phase-specific authority levels without discontinuous jumps at phase boundaries.

**15.** The system of claim 1, further comprising a phase management component configured to maintain a current operational phase selected from a finite ordered set of phases, wherein each phase is associated with a trust threshold and a set of authority bounds, and wherein transitions between phases are deterministic functions of the trust value and the configurable phase thresholds.

**16.** The system of claim 15, wherein the finite ordered set of phases comprises at least a nominal phase permitting full operational authority, a constrained phase permitting reduced authority, a frozen phase prohibiting all operational modifications, and a rollback phase triggering restoration of a prior validated state.

---

### Dependent Claims -- Rollback

**17.** The system of claim 1, wherein the enforcement module maintains a two-layer rollback mechanism comprising:

   a) a first layer storing snapshots of internal governance state including divergence history, trust state, and evaluation step count; and

   b) a second layer storing snapshots of domain-specific external state captured via the domain adapter interface;

   wherein both layers are restored independently during a rollback operation, and wherein snapshots are immutable deep copies of the respective state at the time of validation.

**18.** The method of claim 2, wherein a rollback is triggered when any of the following conditions is met: the trust value falls below the configurable rollback threshold, or the trust value has remained in a frozen state for more than a configurable number of consecutive evaluation steps.

---

### Dependent Claims -- Domain Adapter

**19.** The system of claim 1, wherein the domain adapter interface is an abstract interface comprising:

   a) a divergence computation method that accepts domain-specific parameters and returns divergence measurements for each configured measurement axis;

   b) a state capture method that returns a serializable snapshot of domain-specific state; and

   c) a state restoration method that accepts a previously captured snapshot and restores domain-specific state to a captured condition;

   wherein the governance system operates identically across different domains by substituting different concrete implementations of said domain adapter interface without modification to the governance logic.

---

### Dependent Claims -- Audit Trail

**20.** The system of claim 1, wherein each governance record in the tamper-evident chain includes at least: a timestamp, a domain identifier, individual divergence axis values, the combined divergence value, the trust value, a phase classification, the authority constraint, a governance action identifier, and a cryptographic hash of an immediately preceding governance record.

**21.** The system of claim 20, wherein modification of any governance record invalidates the cryptographic hash of that record and all subsequent records in the chain, thereby rendering any tampering detectable by recomputation of the hash chain from a declared genesis hash.

**22.** The system of claim 20, further comprising a session root hash representing a final cryptographic hash of the tamper-evident chain for a complete governance session, wherein the session root hash uniquely identifies a complete sequence of governance decisions.

**23.** The method of claim 2, wherein the governance records are sufficient to enable deterministic replay of all governance decisions, including reconstruction of a sequence of divergence values, trust values, authority constraints, and governance actions for any governance session.

---

### Dependent Claims -- Recovery and Emergency

**24.** The system of claim 1, further comprising a recovery mechanism configured to automatically increase the trust value after a configurable number of consecutive evaluation steps during which the combined divergence value remains below a configurable low-stress threshold, wherein a rate of trust recovery is modulated by a severity and a recurrence of prior crises stored in the crisis memory bank.

**25.** The system of claim 1, further comprising an emergency override mechanism configured to force the trust value to a minimum level and transition the system to a frozen phase when the combined divergence value exceeds a configurable emergency ceiling, regardless of a current trust value.

---

### Dependent Claims -- Cross-Reference

**26.** The system of claim 1, wherein the computing system is further configured to operate in conjunction with a separate runtime actuation governance system that governs how outputs of a governed model are applied to downstream actuators, wherein the computing system constrains how internal parameters of the governed model are modified and the separate runtime actuation governance system constrains how the governed model's outputs are applied, and wherein the computing system and the separate runtime actuation governance system operate as independent but complementary layers.

---

## ABSTRACT

A computing system, method, and computer-readable medium for runtime governance of adaptive systems. The system observes divergence across configurable measurement axes via a domain adapter interface, computes trust via an exponential decay function with exponential moving average smoothing, projects trust forward using divergence trend extrapolation with crisis memory matching, maps trust to authority constraints via linear interpolation between phase-specific levels, and enforces bounded operational modifications through a two-layer rollback mechanism. All governance decisions are recorded in a tamper-evident cryptographically chained audit trail. The system governs operational modifications independently of any specific domain implementation, providing algorithm-agnostic safety constraints on adaptive system behavior.

---

**Total Claims:** 26 (3 independent + 23 dependent)

---

*Classification: CONFIDENTIAL -- Internal / NDA Use Only*
*Applicant: The Wayfinder Trust*
