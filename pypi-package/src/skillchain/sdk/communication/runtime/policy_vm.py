"""
policy_vm.py
============
Permission VM for agent communication.

Prevents tone from being mistaken for authority:
who may delegate, who may commit resources, who may assert authoritative
facts, who may invoke external tools.

Rules are callables: (AgentMessage) → bool
A False return raises PermissionError.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List

from ..models.messages import AgentMessage

PolicyRule = Callable[[AgentMessage], bool]


# ── Built-in rules ────────────────────────────────────────────────────────────

def no_external_write_without_approval(msg: AgentMessage) -> bool:
    perms = msg.permissions or {}
    if perms.get("external_write") and not perms.get("approval_token"):
        return False
    return True


def delegation_requires_authority(msg: AgentMessage) -> bool:
    if msg.act == "delegate":
        perms = msg.permissions or {}
        return bool(perms.get("can_delegate"))
    return True


def confirm_requires_sender_in_thread(msg: AgentMessage) -> bool:
    # Placeholder — in production, cross-check CommitmentStore / DialogueStore
    return True


DEFAULT_RULES: List[PolicyRule] = [
    no_external_write_without_approval,
    delegation_requires_authority,
]


# ── VM ────────────────────────────────────────────────────────────────────────

class PolicyVM:
    def __init__(self, rules: List[PolicyRule] | None = None):
        self.rules: List[PolicyRule] = rules if rules is not None else list(DEFAULT_RULES)

    def add_rule(self, rule: PolicyRule) -> None:
        self.rules.append(rule)

    def check_message(self, msg: AgentMessage) -> None:
        for rule in self.rules:
            if not rule(msg):
                raise PermissionError(
                    f"Policy denied message act={msg.act!r} "
                    f"from sender={msg.sender_id!r} "
                    f"by rule={rule.__name__!r}"
                )
