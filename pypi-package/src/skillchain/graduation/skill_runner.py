"""
skill_runner.py — Execute graduated skills without LLM.

Ported from Velma's NeuroSkillRunner in neurofs/stores/skill_runner.py.
Runs skill code in a restricted namespace with import whitelisting,
timeout enforcement, and structured result capture.
"""

from __future__ import annotations

import importlib
import time
import traceback
from dataclasses import dataclass, field
from typing import Any

from .config import IMPORT_BLACKLIST, IMPORT_WHITELIST


@dataclass
class ExecutionResult:
    """Result from executing a graduated skill."""

    success: bool
    output: str = ""
    data: dict = field(default_factory=dict)
    duration_ms: float = 0.0
    error: str = ""


# -- Safe builtins for the sandbox ------------------------------------------

_SAFE_BUILTINS: dict[str, Any] = {
    "abs": abs, "all": all, "any": any, "bool": bool,
    "dict": dict, "enumerate": enumerate, "filter": filter,
    "float": float, "frozenset": frozenset, "hasattr": hasattr,
    "int": int, "isinstance": isinstance, "issubclass": issubclass,
    "len": len, "list": list, "map": map, "max": max, "min": min,
    "print": print, "range": range, "repr": repr, "reversed": reversed,
    "round": round, "set": set, "sorted": sorted, "str": str,
    "sum": sum, "tuple": tuple, "type": type, "zip": zip,
    "None": None, "True": True, "False": False,
    "Exception": Exception, "ValueError": ValueError,
    "TypeError": TypeError, "KeyError": KeyError,
    "RuntimeError": RuntimeError, "StopIteration": StopIteration,
    "AttributeError": AttributeError, "IndexError": IndexError,
}


def _safe_import(
    name: str,
    globals: dict | None = None,
    locals: dict | None = None,
    fromlist: tuple = (),
    level: int = 0,
) -> Any:
    """Restricted ``__import__`` that only allows whitelisted modules."""
    top_module = name.split(".")[0]

    # Check blacklist first (exact or prefix match)
    for blocked in IMPORT_BLACKLIST:
        if name == blocked or name.startswith(blocked + "."):
            raise ImportError(
                f"Import blocked: '{name}' is on the blacklist."
            )

    # Check whitelist (allow top-level or dotted match)
    allowed = False
    for permitted in IMPORT_WHITELIST:
        top_permitted = permitted.split(".")[0]
        if top_module == top_permitted:
            allowed = True
            break
    if not allowed:
        raise ImportError(
            f"Import denied: '{name}'. Allowed: {', '.join(sorted(IMPORT_WHITELIST))}"
        )

    return importlib.import_module(name)


class SkillRunner:
    """Execute graduated skill code in a sandboxed namespace.

    Skills are Python strings containing an ``execute(context: dict) -> dict``
    function. The runner compiles and executes them with restricted imports
    and safe builtins.

    Parameters
    ----------
    default_timeout_s:
        Default timeout for skill execution in seconds.
    """

    def __init__(self, default_timeout_s: float = 30.0) -> None:
        self._default_timeout = default_timeout_s

    def execute(
        self,
        skill_code: str,
        context: dict,
        timeout_s: float | None = None,
    ) -> ExecutionResult:
        """Execute skill code and return the result.

        Parameters
        ----------
        skill_code:
            Python source containing an ``execute(context) -> dict`` function.
        context:
            Dictionary passed to the skill's ``execute()`` function.
        timeout_s:
            Maximum execution time in seconds (default: 30).

        Returns
        -------
        ExecutionResult
            Structured result with success flag, output, data, timing, and error.
        """
        timeout = timeout_s if timeout_s is not None else self._default_timeout
        start = time.monotonic()

        # Validate code has an execute function
        if "def execute" not in skill_code:
            return ExecutionResult(
                success=False,
                error="Skill code must define an execute(context) function.",
                duration_ms=0.0,
            )

        # Build sandbox namespace
        namespace: dict[str, Any] = {
            "__builtins__": {**_SAFE_BUILTINS, "__import__": _safe_import},
        }

        try:
            # Compile the skill code
            compiled = compile(skill_code, "<skill>", "exec")

            # Execute the module-level code (defines execute())
            exec(compiled, namespace)

            execute_fn = namespace.get("execute")
            if not callable(execute_fn):
                return ExecutionResult(
                    success=False,
                    error="Skill code does not define a callable execute().",
                    duration_ms=_elapsed_ms(start),
                )

            # Call the skill's execute function
            result = execute_fn(context)

            elapsed = _elapsed_ms(start)

            # Enforce timeout (post-hoc — true preemption requires subprocess)
            if elapsed > timeout * 1000:
                return ExecutionResult(
                    success=False,
                    error=f"Skill exceeded timeout ({timeout}s).",
                    duration_ms=elapsed,
                )

            # Parse the result
            if isinstance(result, dict):
                return ExecutionResult(
                    success=bool(result.get("success", False)),
                    output=str(result.get("result", "")),
                    data=result.get("data", {}),
                    duration_ms=elapsed,
                )

            return ExecutionResult(
                success=True,
                output=str(result) if result is not None else "",
                duration_ms=elapsed,
            )

        except ImportError as exc:
            return ExecutionResult(
                success=False,
                error=f"Import restriction: {exc}",
                duration_ms=_elapsed_ms(start),
            )
        except Exception as exc:
            return ExecutionResult(
                success=False,
                error=f"{type(exc).__name__}: {exc}",
                duration_ms=_elapsed_ms(start),
            )


def _elapsed_ms(start: float) -> float:
    """Milliseconds since ``start`` (monotonic)."""
    return (time.monotonic() - start) * 1000
