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
llm_executor.py
===============

LLM-backed step executor for SkillChain pipelines.

Reads each skill's ``skill.md``, sends it to Claude with the upstream
context, parses the structured response, and returns it as the step's
output dict for downstream consumers.

Auth priority:
  1. ``ANTHROPIC_API_KEY`` env var  (standard SDK key)
  2. Claude Code OAuth from ``~/.claude/.credentials.json``
  3. Explicit ``api_key`` passed to constructor

Example::

    from skillchain.sdk.llm_executor import LLMStepExecutor
    from skillchain.sdk.skill_chain import SkillChain

    chain = SkillChain.load("marketplace/chains/tech-confidence-builder.chain.json")
    chain.set_executor(LLMStepExecutor())
    result = chain.execute(initial_context={"user_name": "Pat"})
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Any, Callable, Dict, Optional

from .exceptions import SkillChainError
from .skill_chain import SkillStep, _StepExecutor

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = os.environ.get("VELMA_CLOUD_MODEL", "claude-haiku-4-5-20251001")
_DEFAULT_MAX_TOKENS = 16384

# Marketplace lives relative to this package
_MARKETPLACE_DIR = Path(__file__).resolve().parent.parent / "marketplace"

# OAuth constants (same as neuros anthropic_adapter)
_OAUTH_API_URL = "https://api.anthropic.com/v1/messages"
_OAUTH_API_VERSION = "2023-06-01"
_OAUTH_BETA = "oauth-2025-04-20"
_OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
_OAUTH_TOKEN_ENDPOINT = "https://api.anthropic.com/v1/oauth/token"

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a SkillChain skill executor. You receive a skill definition (a \
structured procedure with inputs, execution phases, and outputs) along \
with an input context from upstream skills in a pipeline.

Your job:
1. Read the skill definition carefully.
2. Execute the procedure using the provided context as your inputs.
3. Produce the outputs described in the skill definition.
4. Return your output as a single JSON object inside a ```json code fence.

Rules:
- Follow the skill's execution phases in order.
- Use the input context to fill in required inputs. If an input is missing, \
use reasonable defaults and note what you assumed.
- Your JSON output keys should match the skill's documented output names.
- Be thorough but concise — produce actionable output, not commentary.
- If the skill has error handling rules, follow them.
"""


# ---------------------------------------------------------------------------
# OAuth helpers (standalone — no NeurOS dependency)
# ---------------------------------------------------------------------------

def _find_oauth_token() -> Optional[str]:
    """Read a valid OAuth token from Claude Code credentials on disk."""
    now_ms = int(time.time() * 1000)

    candidates = [Path.home() / ".claude" / ".credentials.json"]
    appdata = os.environ.get("APPDATA", "")
    if appdata:
        candidates.append(Path(appdata) / ".claude" / ".credentials.json")

    for path in candidates:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            oauth = data.get("claudeAiOauth", {})
            token = oauth.get("accessToken", "")
            expires = oauth.get("expiresAt", 0)
            if token and expires > now_ms + 300_000:  # 5 min buffer
                return token
            # Token expired — try refresh
            if token and oauth.get("refreshToken"):
                refreshed = _refresh_oauth_token(path, data)
                if refreshed:
                    return refreshed
        except Exception:
            continue
    return None


def _refresh_oauth_token(cred_path: Path, cred_data: dict) -> Optional[str]:
    """Refresh an expired OAuth token via the Anthropic token endpoint."""
    try:
        import httpx
    except ImportError:
        return None

    oauth = cred_data.get("claudeAiOauth", {})
    refresh_token = oauth.get("refreshToken", "")
    if not refresh_token:
        return None

    try:
        resp = httpx.post(
            _OAUTH_TOKEN_ENDPOINT,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": _OAUTH_CLIENT_ID,
                "scope": " ".join(oauth.get("scopes", [])),
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        if resp.status_code != 200:
            return None

        result = resp.json()
        new_access = result.get("access_token", "")
        if not new_access:
            return None

        # Write back to disk
        oauth["accessToken"] = new_access
        if result.get("refresh_token"):
            oauth["refreshToken"] = result["refresh_token"]
        oauth["expiresAt"] = int(time.time() * 1000) + result.get("expires_in", 3600) * 1000
        cred_data["claudeAiOauth"] = oauth
        cred_path.write_text(json.dumps(cred_data, indent=2), encoding="utf-8")
        return new_access
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Skill resolver
# ---------------------------------------------------------------------------

def _resolve_skill(skill_name: str) -> Optional[str]:
    """Find and read skill.md content for a given skill name.

    Search order:
      1. marketplace/{skill_name}/skill.md
      2. ~/.skillchain/skills/{skill_name}.md
      3. ~/.claude/skills/{skill_name}.md
    """
    # Marketplace
    mkt = _MARKETPLACE_DIR / skill_name / "skill.md"
    if mkt.exists():
        return mkt.read_text(encoding="utf-8")

    # User-installed skillchain skills
    sc = Path.home() / ".skillchain" / "skills" / f"{skill_name}.md"
    if sc.exists():
        return sc.read_text(encoding="utf-8")

    # Claude Code skills
    cc = Path.home() / ".claude" / "skills" / f"{skill_name}.md"
    if cc.exists():
        return cc.read_text(encoding="utf-8")

    return None


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

_JSON_FENCE_RE = re.compile(r"```json\s*\n(.*?)```", re.DOTALL)


def _parse_response(text: str) -> Dict[str, Any]:
    """Extract structured output from LLM response.

    Strategy:
      1. Find ```json ... ``` code fence -> parse inner JSON
         (try greedy match first to handle nested code fences,
          then non-greedy as fallback)
      2. Try parsing the entire response as JSON
      3. Graceful fallback: wrap raw text in {"result": text}
    """
    # Strategy 1a: code fence — greedy match (handles nested ``` in JSON values)
    greedy = re.search(r"```json\s*\n(.*)```", text, re.DOTALL)
    if greedy:
        try:
            return json.loads(greedy.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 1b: code fence — non-greedy (original, for simple cases)
    match = _JSON_FENCE_RE.search(text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 2: raw JSON
    stripped = text.strip()
    if stripped.startswith("{"):
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            pass

    # Strategy 3: partial JSON recovery — handles truncated code fences
    # (LLM hit token limit before closing ```) or nested fences confusing
    # the regex. Look for the first { and last } in the text.
    first_brace = text.find("{")
    if first_brace != -1:
        # Only attempt if preceding text is whitespace, backticks, or "json"
        prefix = text[:first_brace].strip().replace("`", "").replace("json", "").strip()
        if len(prefix) == 0:
            last_brace = text.rfind("}")
            if last_brace > first_brace:
                candidate = text[first_brace:last_brace + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass

    # Strategy 4: truncation repair — if response starts with JSON-like
    # content but was truncated (no closing }), try to repair by closing
    # open structures. Common with large skill outputs hitting token limits.
    first_brace = text.find("{")
    if first_brace != -1:
        prefix = text[:first_brace].strip().replace("`", "").replace("json", "").strip()
        if len(prefix) == 0:
            candidate = text[first_brace:]
            # Walk backwards from the end looking for a position where
            # closing the open braces/brackets produces valid JSON.
            # Start from the last }, then try last ], last ", last ,
            cut_positions = set()
            for char in ["}", "]", '"', ","]:
                pos = len(candidate)
                for _ in range(5):  # try up to 5 positions per char
                    pos = candidate.rfind(char, 0, pos)
                    if pos > 0:
                        cut_positions.add(pos + 1)
            for cut in sorted(cut_positions, reverse=True):
                snippet = candidate[:cut]
                # Strip trailing comma that would make JSON invalid
                snippet = snippet.rstrip().rstrip(",")
                open_braces = snippet.count("{") - snippet.count("}")
                open_brackets = snippet.count("[") - snippet.count("]")
                repair = snippet
                repair += "]" * max(0, open_brackets)
                repair += "}" * max(0, open_braces)
                try:
                    return json.loads(repair)
                except json.JSONDecodeError:
                    continue

    # Strategy 5: graceful fallback
    return {"result": text}


# ---------------------------------------------------------------------------
# LLM Step Executor
# ---------------------------------------------------------------------------

class LLMStepExecutor(_StepExecutor):
    """Execute skill chain steps by sending skill.md + context to Claude.

    Parameters
    ----------
    model:
        Claude model ID. Defaults to ``VELMA_CLOUD_MODEL`` env var or
        ``claude-haiku-4-5-20251001``.
    api_key:
        Explicit API key. If not provided, auto-detects from env var or
        Claude Code OAuth credentials.
    skill_resolver:
        Optional callable ``(skill_name) -> skill_md_content``. Defaults
        to the built-in filesystem resolver.
    verbose:
        If True, log skill prompts and responses to stdout.
    max_tokens:
        Max response tokens per step. Default 4096.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        skill_resolver: Optional[Callable[[str], Optional[str]]] = None,
        verbose: bool = False,
        max_tokens: int = _DEFAULT_MAX_TOKENS,
    ) -> None:
        self._model = model or _DEFAULT_MODEL
        self._resolve = skill_resolver or _resolve_skill
        self._verbose = verbose
        self._max_tokens = max_tokens

        # Auth: resolve credentials
        self._api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self._oauth_token: Optional[str] = None
        self._client: Any = None

        if self._api_key:
            self._init_sdk_client()
        else:
            # Try OAuth
            self._oauth_token = _find_oauth_token()
            if not self._oauth_token:
                raise SkillChainError(
                    "No API credentials found. Set ANTHROPIC_API_KEY or "
                    "run 'claude login' to authenticate via OAuth."
                )

    def _init_sdk_client(self) -> None:
        """Initialize the Anthropic SDK client."""
        try:
            import anthropic
            self._client = anthropic.Anthropic(api_key=self._api_key)
        except ImportError:
            raise SkillChainError(
                "anthropic package not installed. "
                "Run: pip install anthropic"
            )

    # -- Core execution ----------------------------------------------------

    def run(self, step: SkillStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single skill step via LLM."""
        # 1. Resolve skill content
        skill_md = self._resolve(step.skill_name)
        if not skill_md:
            raise SkillChainError(
                f"Skill '{step.skill_name}' not found. "
                f"Searched marketplace, ~/.skillchain/skills, ~/.claude/skills."
            )

        # 2. Build the prompt
        prompt = self._build_prompt(step, skill_md, context)

        if self._verbose:
            logger.info("=== Step: %s (%s) ===", step.alias, step.skill_name)
            logger.info("Prompt length: %d chars", len(prompt))

        # 3. Call LLM
        response_text = self._call_llm(prompt)

        if self._verbose:
            logger.info("Response length: %d chars", len(response_text))
            logger.info("Response preview: %s", response_text[:500])

        # 4. Parse response
        output = _parse_response(response_text)

        # Tag with metadata
        output["_skill"] = step.skill_name
        output["_alias"] = step.alias

        return output

    # -- Prompt building ---------------------------------------------------

    def _build_prompt(
        self,
        step: SkillStep,
        skill_md: str,
        context: Dict[str, Any],
    ) -> str:
        """Build the user prompt for a skill execution step."""
        # Clean context: remove internal metadata keys from upstream
        clean_ctx = {
            k: v for k, v in context.items()
            if not k.startswith("_") and k not in ("skill", "processed")
        }

        parts = [
            "## Skill Definition\n",
            skill_md,
            "\n\n## Input Context\n",
            "```json",
            json.dumps(clean_ctx, indent=2, default=str),
            "```\n",
        ]

        if step.phase_filter:
            phases = ", ".join(step.phase_filter)
            parts.append(f"\n**Execute only these phases:** {phases}\n")

        if step.config:
            parts.append("\n## Step Configuration\n")
            parts.append("```json")
            parts.append(json.dumps(step.config, indent=2, default=str))
            parts.append("```\n")

        parts.append(
            "\nExecute this skill using the input context above. "
            "Return your complete output as a single valid JSON object. "
            "IMPORTANT: Do NOT wrap the JSON in a code fence (no ```json blocks). "
            "Output ONLY the raw JSON object starting with { and ending with }. "
            "If any JSON string values contain code, diagrams, or markdown, "
            "escape all special characters properly (newlines as \\n, quotes as \\\", "
            "backticks as literal characters within the string). "
            "The response must be parseable by json.loads() directly."
        )

        return "\n".join(parts)

    # -- LLM calling -------------------------------------------------------

    def _call_llm(self, prompt: str) -> str:
        """Send prompt to Claude and return response text."""
        if self._client:
            return self._call_via_sdk(prompt)
        elif self._oauth_token:
            return self._call_via_oauth(prompt)
        else:
            raise SkillChainError("No LLM client available.")

    def _call_via_sdk(self, prompt: str) -> str:
        """Call Claude via the Anthropic SDK."""
        try:
            response = self._client.messages.create(
                model=self._model,
                max_tokens=self._max_tokens,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )

            text_parts = []
            for block in response.content:
                if hasattr(block, "text"):
                    text_parts.append(block.text)
            return "\n".join(text_parts).strip()

        except Exception as exc:
            raise SkillChainError(f"LLM call failed: {exc}") from exc

    def _call_via_oauth(self, prompt: str) -> str:
        """Call Claude via raw HTTP with OAuth token."""
        try:
            import httpx
        except ImportError:
            raise SkillChainError("httpx required for OAuth. Run: pip install httpx")

        body = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "system": _SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        }

        headers = {
            "Authorization": f"Bearer {self._oauth_token}",
            "Content-Type": "application/json",
            "anthropic-version": _OAUTH_API_VERSION,
            "anthropic-beta": _OAUTH_BETA,
        }

        try:
            resp = httpx.post(
                _OAUTH_API_URL,
                json=body,
                headers=headers,
                timeout=120,
            )

            if resp.status_code == 401:
                # Token expired mid-session — try refresh
                new_token = _find_oauth_token()
                if new_token and new_token != self._oauth_token:
                    self._oauth_token = new_token
                    headers["Authorization"] = f"Bearer {new_token}"
                    resp = httpx.post(
                        _OAUTH_API_URL,
                        json=body,
                        headers=headers,
                        timeout=120,
                    )

            if resp.status_code != 200:
                raise SkillChainError(
                    f"Claude API returned {resp.status_code}: {resp.text[:300]}"
                )

            data = resp.json()

            # Log truncation warnings
            stop_reason = data.get("stop_reason", "unknown")
            usage = data.get("usage", {})
            out_tokens = usage.get("output_tokens", 0)
            if stop_reason == "max_tokens":
                logger.warning(
                    "Response truncated at %d tokens (max_tokens=%d). "
                    "Output may be incomplete.",
                    out_tokens, self._max_tokens,
                )

            text_parts = []
            for block in data.get("content", []):
                if block.get("type") == "text":
                    text_parts.append(block["text"])
            return "\n".join(text_parts).strip()

        except SkillChainError:
            raise
        except Exception as exc:
            raise SkillChainError(f"OAuth LLM call failed: {exc}") from exc
