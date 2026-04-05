# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
validation.py — Network SkillShadower for SkillChain.

Adapts the Velma SkillShadower pattern to a decentralized network context:
- Sandboxed skill execution with deterministic environment hashing
- Similarity scoring: 0.6 * Jaccard + 0.4 * bigram overlap
- 5 shadow runs required, 75% match threshold for graduation
- Domain competence gating: validators must have domain expertise
- Dispute resolution: 3 random arbitrators selected by hash

The validation flow:
  1. Skill publisher submits skill + test cases
  2. Network selects validators with domain competence
  3. Each validator runs the skill in sandbox, compares to reference
  4. Validators submit ValidationProof attestations
  5. If 75% of runs pass, skill is validated on-chain

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import hashlib
import logging
import platform
import sys
import time
from dataclasses import dataclass, field
from typing import Optional

from . import config

logger = logging.getLogger("skillchain.protocol.validation")


# ── Similarity Computation ──

def compute_similarity(output_a: str, output_b: str) -> float:
    """Compute text similarity between two outputs.

    Uses a weighted combination of Jaccard word overlap and bigram
    overlap, matching the Velma SkillShadower algorithm.

    Parameters
    ----------
    output_a, output_b : str
        The two text outputs to compare.

    Returns
    -------
    float
        Similarity score in [0, 1].
    """
    if not output_a or not output_b:
        return 0.0

    a = output_a.lower().strip()
    b = output_b.lower().strip()

    if a == b:
        return 1.0

    words_a = set(a.split())
    words_b = set(b.split())

    if not words_a or not words_b:
        return 0.0

    # Jaccard similarity
    intersection = len(words_a & words_b)
    union = len(words_a | words_b)
    jaccard = intersection / union if union > 0 else 0.0

    # Bigram overlap
    def bigrams(text: str) -> set[tuple[str, str]]:
        wl = text.split()
        return set(zip(wl, wl[1:])) if len(wl) > 1 else set()

    bg_a = bigrams(a)
    bg_b = bigrams(b)

    if bg_a and bg_b:
        bg_overlap = len(bg_a & bg_b) / max(len(bg_a | bg_b), 1)
        return (
            config.SIMILARITY_JACCARD_WEIGHT * jaccard
            + config.SIMILARITY_BIGRAM_WEIGHT * bg_overlap
        )

    return jaccard


def compute_environment_hash() -> str:
    """Compute a hash of the execution environment.

    Used to ensure validation runs happen in comparable environments.

    Returns
    -------
    str
        Hex-encoded SHA-256 hash of environment parameters.
    """
    env_info = {
        "python_version": sys.version,
        "platform": platform.platform(),
        "machine": platform.machine(),
    }
    import json
    canonical = json.dumps(env_info, sort_keys=True).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


# ── Data Structures ──

@dataclass
class ValidationProof:
    """
    Proof of a skill validation run.

    Contains the execution hashes, similarity scores, and environment
    hash from a validator's shadow runs of a skill.
    """

    validator_id: str
    skill_hash: str
    publisher_id: str
    run_count: int
    pass_count: int
    similarity_scores: list[float] = field(default_factory=list)
    execution_hashes: list[str] = field(default_factory=list)
    environment_hash: str = ""
    timestamp: float = field(default_factory=time.time)
    signature: str = ""

    @property
    def pass_rate(self) -> float:
        """Fraction of runs that passed the similarity threshold."""
        if self.run_count == 0:
            return 0.0
        return self.pass_count / self.run_count

    @property
    def avg_similarity(self) -> float:
        """Average similarity score across all runs."""
        if not self.similarity_scores:
            return 0.0
        return sum(self.similarity_scores) / len(self.similarity_scores)

    @property
    def is_graduated(self) -> bool:
        """Check if this proof meets graduation criteria."""
        return (
            self.run_count >= config.SHADOW_RUN_COUNT
            and self.pass_rate >= config.GRADUATION_THRESHOLD
        )

    def signable_bytes(self) -> bytes:
        """Canonical bytes for signing."""
        import json
        d = {
            "validator_id": self.validator_id,
            "skill_hash": self.skill_hash,
            "publisher_id": self.publisher_id,
            "run_count": self.run_count,
            "pass_count": self.pass_count,
            "similarity_scores": self.similarity_scores,
            "execution_hashes": self.execution_hashes,
            "environment_hash": self.environment_hash,
            "timestamp": self.timestamp,
        }
        return json.dumps(d, sort_keys=True, separators=(",", ":")).encode("utf-8")


@dataclass
class SkillSubmission:
    """A skill submitted for network validation."""

    skill_hash: str
    publisher_id: str
    domain_tags: list[str] = field(default_factory=list)
    test_cases: list[dict] = field(default_factory=list)
    reference_outputs: list[str] = field(default_factory=list)
    code_hash: str = ""
    submitted_epoch: int = 0
    timestamp: float = field(default_factory=time.time)


@dataclass
class DisputeRecord:
    """Record of a validation dispute."""

    dispute_id: str
    skill_hash: str
    challenger_id: str
    original_validator_id: str
    arbitrator_ids: list[str] = field(default_factory=list)
    arbitrator_votes: dict[str, str] = field(default_factory=dict)  # arb_id -> "uphold" | "overturn"
    resolved: bool = False
    outcome: str = ""   # "upheld" | "overturned"
    timestamp: float = field(default_factory=time.time)

    def resolve(self) -> str:
        """Resolve the dispute based on arbitrator votes.

        Requires at least 2 of 3 arbitrators to agree.

        Returns
        -------
        str
            "upheld" or "overturned".
        """
        if len(self.arbitrator_votes) < 2:
            return ""

        uphold_count = sum(1 for v in self.arbitrator_votes.values() if v == "uphold")
        overturn_count = sum(1 for v in self.arbitrator_votes.values() if v == "overturn")

        if uphold_count >= 2:
            self.resolved = True
            self.outcome = "upheld"
        elif overturn_count >= 2:
            self.resolved = True
            self.outcome = "overturned"

        return self.outcome


# ── Domain Competence ──

class DomainCompetenceGate:
    """
    Checks whether a node has sufficient domain expertise to validate
    skills in a given domain.

    Requirements:
    - 2+ published skills in the domain, OR
    - 3+ validated skills in the domain

    This prevents validators from attesting on domains they don't
    understand, which would produce noisy trust signals.
    """

    def __init__(self) -> None:
        # node_id -> domain -> {"published": int, "validated": int}
        self._domain_records: dict[str, dict[str, dict[str, int]]] = {}

    def record_published(self, node_id: str, domain: str) -> None:
        """Record that a node published a skill in a domain."""
        self._ensure_record(node_id, domain)
        self._domain_records[node_id][domain]["published"] += 1

    def record_validated(self, node_id: str, domain: str) -> None:
        """Record that a node validated a skill in a domain."""
        self._ensure_record(node_id, domain)
        self._domain_records[node_id][domain]["validated"] += 1

    def is_competent(self, node_id: str, domain: str) -> bool:
        """Check if a node is competent in a domain.

        Parameters
        ----------
        node_id : str
            The validator's node ID.
        domain : str
            The skill domain to check.

        Returns
        -------
        bool
            True if the node meets domain competence requirements.
        """
        record = self._domain_records.get(node_id, {}).get(domain)
        if record is None:
            return False
        return record["published"] >= 2 or record["validated"] >= 3

    def get_competent_domains(self, node_id: str) -> list[str]:
        """Return all domains where a node is competent."""
        domains = self._domain_records.get(node_id, {})
        return [d for d in domains if self.is_competent(node_id, d)]

    def _ensure_record(self, node_id: str, domain: str) -> None:
        if node_id not in self._domain_records:
            self._domain_records[node_id] = {}
        if domain not in self._domain_records[node_id]:
            self._domain_records[node_id][domain] = {"published": 0, "validated": 0}


# ── Network Skill Shadower ──

class NetworkSkillShadower:
    """
    Network-level skill validation engine.

    Coordinates the validation of skills submitted to the SkillChain
    network. Validators run skills in sandbox, compare outputs to
    reference, and submit ValidationProof attestations.

    Usage:
        shadower = NetworkSkillShadower()

        # Submit skill for validation
        submission = SkillSubmission(
            skill_hash="abc...",
            publisher_id="node_1...",
            domain_tags=["ml"],
            test_cases=[{"input": "x", "expected": "y"}],
            reference_outputs=["y"],
        )
        shadower.submit_skill(submission)

        # Validator runs shadow tests
        proof = shadower.validate_skill(
            validator_id="node_2...",
            skill_hash="abc...",
            actual_outputs=["y_predicted"],
        )

        # Check graduation
        if shadower.is_graduated("abc..."):
            print("Skill validated!")
    """

    def __init__(self) -> None:
        self._submissions: dict[str, SkillSubmission] = {}
        self._proofs: dict[str, list[ValidationProof]] = {}
        self._domain_gate = DomainCompetenceGate()
        self._disputes: dict[str, DisputeRecord] = {}

    @property
    def domain_gate(self) -> DomainCompetenceGate:
        """Access the domain competence gate."""
        return self._domain_gate

    def submit_skill(self, submission: SkillSubmission) -> None:
        """Submit a skill for network validation.

        Parameters
        ----------
        submission : SkillSubmission
            The skill submission with test cases and reference outputs.
        """
        self._submissions[submission.skill_hash] = submission
        self._proofs.setdefault(submission.skill_hash, [])
        logger.info(
            "Skill submitted: %s from %s (domains=%s, %d test cases)",
            submission.skill_hash[:12], submission.publisher_id[:12],
            submission.domain_tags, len(submission.test_cases),
        )

    def validate_skill(
        self,
        validator_id: str,
        skill_hash: str,
        actual_outputs: list[str],
    ) -> Optional[ValidationProof]:
        """Run validation and produce a proof.

        Compares each actual output against the reference output using
        the similarity metric. Produces a ValidationProof with pass/fail
        counts and similarity scores.

        Parameters
        ----------
        validator_id : str
            The validator running the shadow tests.
        skill_hash : str
            The skill being validated.
        actual_outputs : list[str]
            Outputs from the validator's execution of the skill.

        Returns
        -------
        ValidationProof or None
            The validation proof, or None if the skill is not found
            or outputs don't match test case count.
        """
        submission = self._submissions.get(skill_hash)
        if submission is None:
            logger.warning("Skill %s not found for validation", skill_hash[:12])
            return None

        reference = submission.reference_outputs
        if len(actual_outputs) != len(reference):
            logger.warning(
                "Output count mismatch: %d actual vs %d reference",
                len(actual_outputs), len(reference),
            )
            return None

        # Run similarity comparisons
        similarities: list[float] = []
        execution_hashes: list[str] = []
        pass_count = 0

        for actual, ref in zip(actual_outputs, reference):
            sim = compute_similarity(actual, ref)
            similarities.append(sim)
            exec_hash = hashlib.sha256(actual.encode("utf-8")).hexdigest()
            execution_hashes.append(exec_hash)
            if sim >= config.GRADUATION_THRESHOLD:
                pass_count += 1

        proof = ValidationProof(
            validator_id=validator_id,
            skill_hash=skill_hash,
            publisher_id=submission.publisher_id,
            run_count=len(actual_outputs),
            pass_count=pass_count,
            similarity_scores=similarities,
            execution_hashes=execution_hashes,
            environment_hash=compute_environment_hash(),
        )

        self._proofs[skill_hash].append(proof)

        logger.info(
            "Validation proof: %s by %s — %d/%d passed (avg_sim=%.3f)",
            skill_hash[:12], validator_id[:12],
            pass_count, len(actual_outputs), proof.avg_similarity,
        )

        return proof

    def is_graduated(self, skill_hash: str) -> bool:
        """Check if a skill has accumulated enough passing proofs.

        Graduation requires SHADOW_RUN_COUNT proofs where at least
        GRADUATION_THRESHOLD fraction passed.

        Parameters
        ----------
        skill_hash : str
            The skill hash to check.

        Returns
        -------
        bool
            True if the skill is graduated.
        """
        proofs = self._proofs.get(skill_hash, [])
        if len(proofs) < config.SHADOW_RUN_COUNT:
            return False

        passing = sum(1 for p in proofs if p.is_graduated)
        required = int(config.GRADUATION_THRESHOLD * len(proofs))
        return passing >= max(required, 1)

    def get_proofs(self, skill_hash: str) -> list[ValidationProof]:
        """Get all validation proofs for a skill."""
        return list(self._proofs.get(skill_hash, []))

    # ── Dispute Resolution ──

    def open_dispute(
        self,
        skill_hash: str,
        challenger_id: str,
        original_validator_id: str,
        all_validator_ids: list[str],
    ) -> Optional[DisputeRecord]:
        """Open a dispute against a validation result.

        Selects 3 arbitrators from the validator set using deterministic
        hash selection (excluding challenger and original validator).

        Parameters
        ----------
        skill_hash : str
            The disputed skill.
        challenger_id : str
            The node challenging the validation.
        original_validator_id : str
            The validator whose result is being disputed.
        all_validator_ids : list[str]
            All eligible validators for arbitrator selection.

        Returns
        -------
        DisputeRecord or None
            The dispute record, or None if not enough arbitrators.
        """
        # Filter out challenger and original validator
        eligible = [
            v for v in all_validator_ids
            if v != challenger_id and v != original_validator_id
        ]
        if len(eligible) < 3:
            logger.warning("Not enough arbitrators for dispute on %s", skill_hash[:12])
            return None

        # Deterministic selection: hash(skill_hash + challenger_id) to select 3
        seed = hashlib.sha256(
            (skill_hash + challenger_id).encode()
        ).digest()

        # Sort by hash(seed + validator_id) and take first 3
        scored = []
        for v in eligible:
            score = hashlib.sha256(seed + v.encode()).hexdigest()
            scored.append((score, v))
        scored.sort()
        arbitrators = [v for _, v in scored[:3]]

        dispute_id = hashlib.sha256(
            f"{skill_hash}:{challenger_id}:{time.time()}".encode()
        ).hexdigest()[:16]

        dispute = DisputeRecord(
            dispute_id=dispute_id,
            skill_hash=skill_hash,
            challenger_id=challenger_id,
            original_validator_id=original_validator_id,
            arbitrator_ids=arbitrators,
        )
        self._disputes[dispute_id] = dispute

        logger.info(
            "Dispute opened: %s on skill %s, arbitrators: %s",
            dispute_id, skill_hash[:12],
            [a[:8] for a in arbitrators],
        )
        return dispute

    def submit_arbitrator_vote(
        self, dispute_id: str, arbitrator_id: str, vote: str,
    ) -> Optional[str]:
        """Submit an arbitrator's vote on a dispute.

        Parameters
        ----------
        dispute_id : str
            The dispute identifier.
        arbitrator_id : str
            The voting arbitrator's node ID.
        vote : str
            "uphold" or "overturn".

        Returns
        -------
        str or None
            The dispute outcome if resolved, None if still pending.
        """
        dispute = self._disputes.get(dispute_id)
        if dispute is None or dispute.resolved:
            return None
        if arbitrator_id not in dispute.arbitrator_ids:
            return None
        if vote not in ("uphold", "overturn"):
            return None

        dispute.arbitrator_votes[arbitrator_id] = vote
        outcome = dispute.resolve()

        if outcome:
            logger.info("Dispute %s resolved: %s", dispute_id, outcome)

        return outcome if outcome else None

    def stats(self) -> dict:
        """Return validation statistics."""
        total_skills = len(self._submissions)
        graduated = sum(1 for sh in self._submissions if self.is_graduated(sh))
        total_proofs = sum(len(p) for p in self._proofs.values())
        return {
            "submitted_skills": total_skills,
            "graduated_skills": graduated,
            "total_proofs": total_proofs,
            "open_disputes": sum(1 for d in self._disputes.values() if not d.resolved),
            "resolved_disputes": sum(1 for d in self._disputes.values() if d.resolved),
        }
