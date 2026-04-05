"""
skill_composer.py — Chain skills together via output-to-input matching.

Ported from Velma's SkillCompositionEngine in neurofs/management/skill_composer.py.
Discovers valid skill chains by matching output keys of one skill to input
keys of the next, up to MAX_CHAIN_DEPTH steps.
"""

from __future__ import annotations

import hashlib
import re
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

from .config import MAX_CHAIN_DEPTH
from .skill_runner import ExecutionResult, SkillRunner


# -- Contract inference patterns ---------------------------------------------

_INPUT_CONTEXT = re.compile(r'context\[[\"\'](\w+)[\"\']\]')
_INPUT_CONTEXT_GET = re.compile(r'context\.get\([\"\'](\w+)[\"\'][^)]*\)')
_OUTPUT_DATA = re.compile(r'(?:result|data|output)\[[\"\'](\w+)[\"\']\]')
_OUTPUT_RETURN = re.compile(r'["\'](\w+)["\']\s*:')
# Match keys inside "data": {"key": ...} patterns
_OUTPUT_DATA_DICT = re.compile(r'"data"\s*:\s*\{([^}]+)\}')

# Keys that are always present in context — not real skill inputs
_IMPLICIT_KEYS = frozenset({"success", "error", "result"})


@dataclass
class SkillContract:
    """Input/output contract for a graduated skill."""

    skill_id: str
    skill_name: str
    inputs: tuple[str, ...]
    outputs: tuple[str, ...]
    domain: str = ""


@dataclass
class CompositeSkill:
    """A chain of skills that execute sequentially."""

    name: str
    chain: list[str]  # ordered skill IDs
    domain: str
    inferred_contract: SkillContract | None = None


# -- Graduated skill reference (lightweight, avoids circular import) ---------

@dataclass
class _SkillRef:
    """Lightweight skill reference used inside the composer."""

    skill_id: str
    name: str
    code: str
    domain: str


class SkillComposer:
    """Discover and execute skill chains via input/output contract matching.

    Parameters
    ----------
    runner:
        SkillRunner instance for executing individual skills in a chain.
    max_chain_depth:
        Maximum number of skills in a single chain.
    """

    def __init__(
        self,
        runner: SkillRunner | None = None,
        max_chain_depth: int = MAX_CHAIN_DEPTH,
    ) -> None:
        self._runner = runner
        self._max_depth = max_chain_depth
        self._contracts: dict[str, SkillContract] = {}
        self._skills: dict[str, _SkillRef] = {}
        # output_key -> set of skill_ids that produce it
        self._output_index: dict[str, set[str]] = defaultdict(set)

    # -- Registration --------------------------------------------------------

    def register_skill(
        self,
        skill_id: str,
        name: str,
        code: str,
        domain: str = "",
    ) -> Optional[SkillContract]:
        """Register a skill and infer its contract from code.

        Returns the inferred contract, or ``None`` if no I/O could be detected.
        """
        self._skills[skill_id] = _SkillRef(skill_id, name, code, domain)
        contract = self._infer_contract(skill_id, name, code, domain)
        if contract:
            self._contracts[skill_id] = contract
            for out_key in contract.outputs:
                self._output_index[out_key].add(skill_id)
        return contract

    # -- Chain Discovery -----------------------------------------------------

    def discover_chains(
        self,
        skill_ids: list[str] | None = None,
    ) -> list[CompositeSkill]:
        """Discover valid 2-step chains among registered skills.

        For every pair (A, B) where an output of A matches an input of B,
        a CompositeSkill is created. Chains longer than 2 are built by
        recursively extending discovered pairs up to ``max_chain_depth``.

        Parameters
        ----------
        skill_ids:
            If provided, only consider these skills. Otherwise use all
            registered skills.

        Returns
        -------
        list[CompositeSkill]
            Discovered chains ordered by chain length (shortest first).
        """
        ids = skill_ids or list(self._contracts.keys())
        chains: list[CompositeSkill] = []
        seen: set[str] = set()

        for sid_a in ids:
            contract_a = self._contracts.get(sid_a)
            if not contract_a:
                continue

            for out_key in contract_a.outputs:
                for sid_b in self._output_index.get(out_key, set()) | set(ids):
                    if sid_b == sid_a:
                        continue
                    contract_b = self._contracts.get(sid_b)
                    if not contract_b:
                        continue
                    # Check if any output of A matches any input of B
                    overlap = set(contract_a.outputs) & set(contract_b.inputs)
                    if not overlap:
                        continue

                    chain_key = f"{sid_a}->{sid_b}"
                    if chain_key in seen:
                        continue
                    seen.add(chain_key)

                    name_a = self._skills[sid_a].name if sid_a in self._skills else sid_a
                    name_b = self._skills[sid_b].name if sid_b in self._skills else sid_b

                    composite = CompositeSkill(
                        name=f"{name_a}_then_{name_b}",
                        chain=[sid_a, sid_b],
                        domain=contract_a.domain or contract_b.domain,
                        inferred_contract=SkillContract(
                            skill_id=chain_key,
                            skill_name=f"{name_a}_then_{name_b}",
                            inputs=contract_a.inputs,
                            outputs=contract_b.outputs,
                            domain=contract_a.domain,
                        ),
                    )
                    chains.append(composite)

        return sorted(chains, key=lambda c: len(c.chain))

    # -- Chain Execution -----------------------------------------------------

    def execute_chain(
        self,
        chain: CompositeSkill,
        initial_context: dict,
    ) -> ExecutionResult:
        """Execute a composite skill chain, piping outputs through.

        Each skill's output ``data`` dict is merged into the running context
        before the next skill executes.

        Parameters
        ----------
        chain:
            The composite skill to execute.
        initial_context:
            Starting context dict.

        Returns
        -------
        ExecutionResult
            Result from the final skill in the chain, or the first failure.
        """
        if not self._runner:
            return ExecutionResult(
                success=False,
                error="No SkillRunner configured for chain execution.",
            )

        if len(chain.chain) > self._max_depth:
            return ExecutionResult(
                success=False,
                error=f"Chain depth {len(chain.chain)} exceeds max {self._max_depth}.",
            )

        context = dict(initial_context)
        last_result = ExecutionResult(success=False, error="Empty chain")

        for skill_id in chain.chain:
            ref = self._skills.get(skill_id)
            if not ref:
                return ExecutionResult(
                    success=False,
                    error=f"Skill '{skill_id}' not registered.",
                )

            last_result = self._runner.execute(ref.code, context)
            if not last_result.success:
                return last_result

            # Merge output data into context for the next skill
            if last_result.data:
                context.update(last_result.data)

        return last_result

    # -- Internal: Contract Inference ----------------------------------------

    def _infer_contract(
        self,
        skill_id: str,
        name: str,
        code: str,
        domain: str,
    ) -> Optional[SkillContract]:
        """Infer input/output contract from skill code."""
        if not code:
            return None

        inputs: set[str] = set()
        inputs.update(_INPUT_CONTEXT.findall(code))
        inputs.update(_INPUT_CONTEXT_GET.findall(code))
        inputs -= _IMPLICIT_KEYS

        outputs: set[str] = set()
        outputs.update(_OUTPUT_DATA.findall(code))

        # Look for keys inside "data": {"key": ...} patterns
        for data_block in _OUTPUT_DATA_DICT.findall(code):
            data_keys = re.findall(r'["\'](\w+)["\']\s*:', data_block)
            outputs.update(data_keys)

        # Fallback: look for return dict keys in execute() body
        if not outputs:
            exec_match = re.search(
                r'def execute\s*\([^)]*\)\s*(?:->.*?)?:\s*\n(.*)',
                code, re.DOTALL,
            )
            if exec_match:
                return_matches = re.findall(
                    r'return\s*\{([^}]+)\}', exec_match.group(1), re.DOTALL,
                )
                for block in return_matches:
                    keys = re.findall(r'["\'](\w+)["\']\s*:', block)
                    outputs.update(keys)

        outputs -= _IMPLICIT_KEYS

        if not inputs and not outputs:
            return None

        return SkillContract(
            skill_id=skill_id,
            skill_name=name,
            inputs=tuple(sorted(inputs)),
            outputs=tuple(sorted(outputs)),
            domain=domain,
        )
