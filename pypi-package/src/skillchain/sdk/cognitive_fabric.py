"""
cognitive_fabric.py
===================
CognitiveFabric — the unified execution context for SkillChain flows.

Holds all cognitive infrastructure that a flow runs inside:
  - TKG (durable fact store)
  - ProvenanceStore
  - DialogueStore
  - AssumptionStore
  - CommitmentStore
  - SpeechActDispatcher
  - CapabilityNegotiator
  - PromotionBridge

Usage::

    fabric = CognitiveFabric.create()                 # default in-memory
    fabric = CognitiveFabric.create(persist=True)     # load/save to ~/.skillchain/

    chain = SkillChain("research-launch")
    chain.add("research-synthesizer")
    result = chain.execute(initial_context={...}, fabric=fabric)

    # After execution, TKG has one Observation per completed step.
    results = fabric.tkg.query(query_text="research")
    fabric.save()
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .tkg import TemporalKnowledgeGraph, PromotionBridge
from .communication import (
    AgentMessage,
    Observation, Inference,
    DialogueStore,
    AssumptionStore,
    CommitmentStore,
    ProvenanceStore, ProvenanceNode,
    SpeechActDispatcher,
    CapabilityNegotiator,
    PolicyVM,
)

logger = logging.getLogger(__name__)

_SKILLCHAIN_DIR = Path.home() / ".skillchain"


@dataclass
class StepObservation:
    """What the fabric records about a single step execution."""
    chain_name: str
    step_alias: str
    skill_name: str
    status: str           # "completed" | "failed" | "skipped"
    duration_ms: float
    output_keys: List[str]
    error: str = ""
    assertion_id: Optional[str] = None   # TKG assertion if promoted


class CognitiveFabric:
    """
    The cognitive infrastructure that flows execute inside.

    All stores are in-memory by default. Use persist=True (or set
    persist_dir) to load from and save to ~/.skillchain/fabric/.
    """

    def __init__(
        self,
        tkg: TemporalKnowledgeGraph,
        provenance: ProvenanceStore,
        dialogue: DialogueStore,
        assumptions: AssumptionStore,
        commitments: CommitmentStore,
        negotiator: CapabilityNegotiator,
        policy_vm: PolicyVM,
        bridge: PromotionBridge,
        dispatcher: SpeechActDispatcher,
        persist_dir: Optional[Path] = None,
        fabric_id: str = "",
    ):
        self.tkg = tkg
        self.provenance = provenance
        self.dialogue = dialogue
        self.assumptions = assumptions
        self.commitments = commitments
        self.negotiator = negotiator
        self.policy_vm = policy_vm
        self.bridge = bridge
        self.dispatcher = dispatcher
        self.persist_dir = persist_dir
        self.fabric_id = fabric_id or str(uuid.uuid4())[:8]

        self._step_log: List[StepObservation] = []
        self._plan_store: Dict[str, Any] = {}
        self._sessions: Dict[str, Any] = {}

    # ── Factory ───────────────────────────────────────────────────────────────

    @classmethod
    def create(
        cls,
        persist: bool = False,
        persist_dir: Optional[Path] = None,
        fabric_id: str = "",
    ) -> CognitiveFabric:
        """Create a CognitiveFabric with all components wired together."""

        base = persist_dir or (_SKILLCHAIN_DIR / "fabric")

        tkg_path = (base / "tkg.json") if persist else None
        dialogue_path = (base / "dialogue.json") if persist else None

        tkg = TemporalKnowledgeGraph(persist_path=tkg_path)
        provenance = ProvenanceStore()
        dialogue = DialogueStore(persist_path=dialogue_path)
        assumptions = AssumptionStore()
        commitments = CommitmentStore()
        policy_vm = PolicyVM()
        negotiator = CapabilityNegotiator()

        bridge = PromotionBridge(tkg, provenance)

        plan_store: Dict[str, Any] = {}
        sessions: Dict[str, Any] = {}
        dispatcher = SpeechActDispatcher.build(
            dialogue, commitments, assumptions, plan_store, sessions, policy_vm
        )

        fabric = cls(
            tkg=tkg,
            provenance=provenance,
            dialogue=dialogue,
            assumptions=assumptions,
            commitments=commitments,
            negotiator=negotiator,
            policy_vm=policy_vm,
            bridge=bridge,
            dispatcher=dispatcher,
            persist_dir=base if persist else None,
            fabric_id=fabric_id,
        )
        fabric._plan_store = plan_store
        fabric._sessions = sessions
        return fabric

    # ── Flow lifecycle hooks ──────────────────────────────────────────────────

    def on_step_complete(
        self,
        chain_name: str,
        step_alias: str,
        skill_name: str,
        status: str,
        output: Dict[str, Any],
        duration_ms: float,
        error: str = "",
        agent_id: str = "chain-executor",
    ) -> StepObservation:
        """
        Called by SkillChain after each step completes.

        Records an Observation into the TKG (if step completed),
        or a failed-state observation (if step failed).
        """
        claim = (
            f"{chain_name}/{step_alias} ({skill_name}) completed in {duration_ms:.0f}ms"
            if status == "completed"
            else f"{chain_name}/{step_alias} ({skill_name}) {status}: {error}"
        )

        obs = Observation(
            claim=claim,
            source=f"chain:{chain_name}",
            observed_at=datetime.now(timezone.utc).isoformat(),
            confidence=0.95 if status == "completed" else 0.85,
            verifiability="checkable",
            confidence_basis="direct execution result",
        )
        obs.metadata.update({
            "chain_name": chain_name,
            "step_alias": step_alias,
            "skill_name": skill_name,
            "status": status,
            "output_keys": list(output.keys()),
            "duration_ms": duration_ms,
        })

        # Record provenance
        msg_id = f"step:{chain_name}/{step_alias}:{uuid.uuid4().hex[:8]}"
        pnode = ProvenanceNode(
            object_id=obs.id,
            object_type="Observation",
            asserted_by_agent=agent_id,
            source_message_id=msg_id,
            derivation_kind="observed",
        )
        self.provenance.record(pnode)
        self.provenance.mark_verified(obs.id)   # execution result is inherently verified

        # Promote to TKG
        result = self.bridge.promote(obs)
        assertion_id = result.assertion_id if result.promoted else None

        if result.promoted:
            logger.debug("TKG: step observation promoted → %s", assertion_id)
        else:
            logger.debug("TKG: step observation not promoted: %s", result.rejection_reason)

        step_obs = StepObservation(
            chain_name=chain_name,
            step_alias=step_alias,
            skill_name=skill_name,
            status=status,
            duration_ms=duration_ms,
            output_keys=list(output.keys()),
            error=error,
            assertion_id=assertion_id,
        )
        self._step_log.append(step_obs)
        return step_obs

    def on_chain_complete(
        self,
        chain_name: str,
        success: bool,
        total_duration_ms: float,
        step_count: int,
        agent_id: str = "chain-executor",
    ) -> Optional[str]:
        """
        Called by SkillChain after the full chain finishes.

        Records a chain-level Inference (derived from individual step observations).
        Returns the TKG assertion ID if promoted.
        """
        completed_steps = [s for s in self._step_log if s.chain_name == chain_name and s.status == "completed"]
        parent_ids = [s.assertion_id for s in completed_steps if s.assertion_id]

        claim = (
            f"Chain '{chain_name}' completed successfully ({step_count} steps, {total_duration_ms:.0f}ms)"
            if success
            else f"Chain '{chain_name}' finished with failures ({step_count} steps)"
        )

        from .communication import Inference as Inf
        inf = Inf(
            claim=claim,
            derived_from=parent_ids,
            method="chain_execution",
            confidence=0.92 if success else 0.80,
            confidence_basis="aggregated step results",
            verifiability="checkable",
        )

        msg_id = f"chain:{chain_name}:complete:{uuid.uuid4().hex[:8]}"
        pnode = ProvenanceNode(
            object_id=inf.id,
            object_type="Inference",
            asserted_by_agent=agent_id,
            source_message_id=msg_id,
            derivation_kind="inferred",
            parent_ids=parent_ids,
        )
        self.provenance.record(pnode)
        self.provenance.mark_verified(inf.id)

        result = self.bridge.promote(inf)
        return result.assertion_id if result.promoted else None

    # ── Communication helpers ─────────────────────────────────────────────────

    def dispatch(self, msg: AgentMessage) -> Dict[str, Any]:
        """Route a message through the speech act dispatcher."""
        return self.dispatcher.dispatch(msg)

    # ── Persistence ───────────────────────────────────────────────────────────

    def save(self) -> None:
        """Persist TKG and dialogue to disk."""
        self.tkg.save()
        self.dialogue.save()
        logger.info("CognitiveFabric saved (id=%s)", self.fabric_id)

    # ── Stats ─────────────────────────────────────────────────────────────────

    def stats(self) -> Dict[str, Any]:
        return {
            "fabric_id": self.fabric_id,
            "tkg": self.tkg.stats(),
            "steps_observed": len(self._step_log),
            "active_commitments": len(self.commitments.active()),
            "active_assumptions": len(self.assumptions.active()),
            "open_threads": len(self.dialogue.open_threads()),
        }
