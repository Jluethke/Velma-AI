"""
dispatcher.py
=============
SpeechActDispatcher — routes AgentMessage to the correct handler
by the message's declared speech act.

This is the main entry point for all inbound messages.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from ..models.messages import AgentMessage, SpeechAct
from ..handlers.base import BaseHandler


class SpeechActDispatcher:
    """
    Routes messages to registered handlers by speech act.

    Usage::

        dispatcher = SpeechActDispatcher.build(stores, policy_vm)
        result = dispatcher.dispatch(msg)
    """

    def __init__(self, handlers: Dict[str, BaseHandler]):
        self._handlers = handlers

    def dispatch(self, msg: AgentMessage) -> Dict[str, Any]:
        handler = self._handlers.get(msg.act)
        if handler is None:
            raise ValueError(
                f"No handler registered for speech act {msg.act!r}. "
                f"Registered acts: {list(self._handlers.keys())}"
            )
        return handler.handle(msg)

    def can_handle(self, act: str) -> bool:
        return act in self._handlers

    @classmethod
    def build(
        cls,
        dialogue_store: Any,
        commitment_store: Any,
        assumption_store: Any,
        plan_store: Dict[str, Any],
        negotiation_sessions: Dict[str, Any],
        policy_vm: Any,
    ) -> SpeechActDispatcher:
        """
        Convenience factory that wires up the standard handler set.

        The four MVP acts (ask / propose / challenge / confirm) plus revise.
        """
        from ..handlers.ask import AskHandler
        from ..handlers.propose import ProposeHandler
        from ..handlers.challenge import ChallengeHandler
        from ..handlers.revise import ReviseHandler
        from ..handlers.confirm import ConfirmHandler

        handlers: Dict[str, BaseHandler] = {
            "ask": AskHandler(dialogue_store),
            "propose": ProposeHandler(dialogue_store, plan_store, policy_vm, negotiation_sessions),
            "challenge": ChallengeHandler(dialogue_store, negotiation_sessions),
            "revise": ReviseHandler(dialogue_store, plan_store, negotiation_sessions),
            "confirm": ConfirmHandler(dialogue_store, commitment_store, plan_store, negotiation_sessions),
        }
        return cls(handlers)
