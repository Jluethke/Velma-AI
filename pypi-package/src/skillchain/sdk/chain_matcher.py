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
chain_matcher.py
================

Plain-English chain discovery. Takes a natural language query like
"I'm scared of technology and don't know what crypto is" and returns
ranked chain matches with explanations.

No ML, no embeddings — pure keyword scoring + synonym expansion +
category boosting. Fast, deterministic, zero dependencies.

Example::

    from skillchain.sdk.chain_matcher import ChainMatcher

    matcher = ChainMatcher(chains)  # list of chain dicts from JSON
    results = matcher.match("help me get a job")
    # → [ChainMatch(chain_name="job-search-blitz", score=2.1, ...)]
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


# ---------------------------------------------------------------------------
# Intent → category mapping (synonym expansion)
# ---------------------------------------------------------------------------

INTENT_MAP: dict[str, list[str]] = {
    # Life situations
    "scared": ["onboarding"],
    "afraid": ["onboarding"],
    "overwhelmed": ["onboarding"],
    "confused": ["onboarding"],
    "don't understand": ["onboarding"],
    "dont understand": ["onboarding"],
    "too old": ["onboarding"],
    "not tech savvy": ["onboarding"],
    "technophobe": ["onboarding"],
    "boomer": ["onboarding"],

    # Home & moving
    "moving": ["home"],
    "move": ["home"],
    "new house": ["home"],
    "new home": ["home"],
    "homeowner": ["home"],
    "bought a house": ["home"],
    "apartment": ["home"],
    "rent": ["home"],
    "maintenance": ["home"],
    "repair": ["home"],

    # Career
    "job": ["career"],
    "resume": ["career"],
    "interview": ["career"],
    "career": ["career"],
    "salary": ["career"],
    "negotiate": ["career"],
    "hired": ["career"],
    "hiring": ["career"],
    "unemployed": ["career"],
    "laid off": ["career"],
    "career change": ["career"],
    "returning to work": ["career"],
    "back to work": ["career"],
    "mom returning": ["career"],
    "dad returning": ["career"],
    "parent relaunch": ["career"],

    # Money
    "budget": ["money"],
    "money": ["money"],
    "financial": ["money"],
    "debt": ["money"],
    "saving": ["money"],
    "savings": ["money"],
    "retire": ["life"],
    "retirement": ["life"],
    "pension": ["life"],
    "social security": ["life"],
    "401k": ["life"],
    "scam": ["onboarding"],
    "fraud": ["onboarding"],
    "phishing": ["onboarding"],

    # Health
    "health": ["life"],
    "exercise": ["life"],
    "fitness": ["life"],
    "workout": ["life"],
    "medication": ["life"],
    "medicine": ["life"],
    "pills": ["life"],
    "doctor": ["life"],
    "symptom": ["life"],
    "diet": ["life"],
    "weight": ["life"],
    "meal": ["life"],
    "food": ["life"],
    "cook": ["life"],
    "grocery": ["life"],

    # Family
    "baby": ["family"],
    "kid": ["family"],
    "kids": ["family"],
    "child": ["family"],
    "children": ["family"],
    "pet": ["family"],
    "dog": ["family"],
    "cat": ["family"],
    "family": ["family"],
    "emergency": ["family"],
    "disaster": ["family"],
    "preparedness": ["family"],

    # Business
    "business": ["business"],
    "side hustle": ["business"],
    "freelance": ["business"],
    "entrepreneur": ["business"],
    "startup": ["founder"],
    "founder": ["founder"],
    "launch": ["founder", "business"],
    "customers": ["business", "founder"],
    "marketing": ["business"],
    "social media": ["business"],
    "content": ["business"],
    "bookkeeping": ["business"],
    "taxes": ["business"],
    "invoice": ["business"],

    # Tech / Dev
    "crypto": ["onboarding"],
    "bitcoin": ["onboarding"],
    "blockchain": ["onboarding"],
    "ai": ["onboarding"],
    "artificial intelligence": ["onboarding"],
    "chatgpt": ["onboarding"],
    "password": ["onboarding"],
    "hacked": ["onboarding"],
    "privacy": ["onboarding"],
    "debug": ["developer"],
    "code": ["developer"],
    "api": ["developer"],
    "programming": ["developer"],
    "software": ["developer"],
    "developer": ["developer"],
    "error message": ["onboarding"],
    "pop up": ["onboarding"],
    "popup": ["onboarding"],

    # Events & lifestyle
    "party": ["life"],
    "birthday": ["life"],
    "wedding": ["life"],
    "graduation": ["life"],
    "holiday": ["life"],
    "gift": ["life"],
    "present": ["life"],
    "vacation": ["life"],
    "travel": ["life"],
    "trip": ["life"],
    "stuck": ["life"],
    "paralyzed": ["life"],
    "unmotivated": ["life"],
    "lost": ["life"],
    "anxious": ["life"],
    "stressed": ["life"],
    "burned out": ["life"],
    "burnout": ["life"],
    "overwhelmed": ["onboarding"],
    "decision": ["life"],
    "conversation": ["life"],
    "difficult": ["life"],
    "declutter": ["life"],
    "organize": ["life"],
    "clean": ["life"],

    # Learning
    "learn": ["learning"],
    "study": ["learning"],
    "explain": ["learning"],
    "understand": ["learning"],
    "course": ["learning"],
    "certification": ["learning"],
    "exam": ["learning"],
    "student": ["learning"],

    # Email / communication
    "email": ["life"],
    "complaint": ["life"],
    "letter": ["life"],
}

# Stopwords to ignore during keyword matching
_STOPWORDS = frozenset({
    "i", "me", "my", "we", "our", "you", "your", "a", "an", "the",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would",
    "shall", "should", "can", "could", "may", "might", "must",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "and", "or", "but", "not", "no", "so", "if", "then", "than",
    "that", "this", "it", "its", "what", "which", "who", "whom",
    "how", "when", "where", "why", "all", "each", "every", "both",
    "some", "any", "few", "more", "most", "other", "into", "about",
    "up", "out", "just", "also", "very", "too", "really", "need",
    "want", "help", "get", "got", "like", "know", "think", "feel",
    "don't", "dont", "im", "i'm", "ive", "i've",
})

_WORD_RE = re.compile(r"[a-z0-9]+(?:'[a-z]+)?")


# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------

@dataclass
class ChainMatch:
    """A chain that matches a user query."""

    chain_name: str
    description: str
    category: str
    score: float
    match_reason: str
    skills: list[str] = field(default_factory=list)
    step_count: int = 0


# ---------------------------------------------------------------------------
# Chain Matcher
# ---------------------------------------------------------------------------

class ChainMatcher:
    """Score and rank skill chains against plain-English queries.

    Parameters
    ----------
    chains:
        List of chain definition dicts (loaded from .chain.json files).
    """

    def __init__(self, chains: list[dict[str, Any]]) -> None:
        self._chains = chains
        self._index: list[_ChainEntry] = []
        self._build_index()

    def _build_index(self) -> None:
        """Pre-process all chains into searchable entries."""
        for chain in self._chains:
            name = chain.get("name", "")
            description = chain.get("description", "")
            category = chain.get("category", "")
            steps = chain.get("steps", [])
            skill_names = [s.get("skill_name", "") for s in steps]
            aliases = [s.get("alias", "") for s in steps]

            # Build token bag from all text fields
            all_text = " ".join([
                name.replace("-", " "),
                description,
                category,
                " ".join(s.replace("-", " ") for s in skill_names),
                " ".join(a.replace("-", " ") for a in aliases),
            ]).lower()

            tokens = set(_WORD_RE.findall(all_text)) - _STOPWORDS

            self._index.append(_ChainEntry(
                name=name,
                description=description,
                category=category,
                skill_names=skill_names,
                aliases=aliases,
                tokens=tokens,
                step_count=len(steps),
            ))

    def match(self, query: str, top_k: int = 5) -> list[ChainMatch]:
        """Find chains matching a natural language query.

        Parameters
        ----------
        query:
            Plain English — "I'm scared of technology", "help me get a job",
            "I need to move to a new city", etc.
        top_k:
            Maximum number of results.

        Returns
        -------
        list[ChainMatch]
            Ranked matches, best first.
        """
        # Input validation
        if query and len(query) > 1000:
            query = query[:1000]

        if not query or not query.strip():
            # No query -> return all chains sorted by name
            return [
                ChainMatch(
                    chain_name=e.name,
                    description=e.description,
                    category=e.category,
                    score=0.0,
                    match_reason="(all chains)",
                    skills=e.skill_names,
                    step_count=e.step_count,
                )
                for e in sorted(self._index, key=lambda e: e.name)
            ][:top_k]

        query_lower = query.lower()
        query_tokens = set(_WORD_RE.findall(query_lower)) - _STOPWORDS

        # Expand query with intent synonyms
        matched_categories: set[str] = set()
        matched_intents: list[str] = []

        # Check multi-word intents first (longest match)
        for intent_phrase, categories in sorted(INTENT_MAP.items(), key=lambda x: -len(x[0])):
            if intent_phrase in query_lower:
                matched_categories.update(categories)
                matched_intents.append(intent_phrase)

        # Check single-word intents
        for token in query_tokens:
            if token in INTENT_MAP:
                matched_categories.update(INTENT_MAP[token])
                if token not in matched_intents:
                    matched_intents.append(token)

        # Score each chain
        scored: list[tuple[float, list[str], _ChainEntry]] = []

        for entry in self._index:
            score = 0.0
            reasons: list[str] = []

            # 1. Keyword overlap
            overlap = query_tokens & entry.tokens
            if overlap:
                # Normalize by query length to avoid bias toward long chains
                keyword_score = len(overlap) / max(len(query_tokens), 1)
                score += keyword_score
                reasons.append(f"keywords: {', '.join(sorted(overlap)[:5])}")

            # 2. Category boost
            if entry.category and entry.category in matched_categories:
                score += 0.4
                reasons.append(f"category: {entry.category}")

            # 3. Skill name match (query directly mentions a skill)
            for skill in entry.skill_names:
                skill_words = set(skill.replace("-", " ").split())
                skill_overlap = query_tokens & skill_words
                if len(skill_overlap) >= 1 and len(skill_overlap) / len(skill_words) >= 0.5:
                    score += 0.5
                    reasons.append(f"skill: {skill}")
                    break  # One skill match is enough

            # 4. Description substring match (catches multi-word phrases)
            desc_lower = entry.description.lower()
            # Check if significant query phrases appear in description
            for intent in matched_intents:
                if intent in desc_lower or intent in entry.name.replace("-", " "):
                    score += 0.3
                    reasons.append(f"intent: {intent}")
                    break  # One intent match bonus is enough

            # 5. Name match bonus (query words appear directly in chain name)
            name_words = set(entry.name.replace("-", " ").split())
            name_overlap = query_tokens & name_words
            if name_overlap:
                score += 0.3 * (len(name_overlap) / len(name_words))
                reasons.append(f"name: {entry.name}")

            if score > 0:
                scored.append((score, reasons, entry))

        # Sort by score descending
        scored.sort(key=lambda x: -x[0])

        results: list[ChainMatch] = []
        for score, reasons, entry in scored[:top_k]:
            results.append(ChainMatch(
                chain_name=entry.name,
                description=entry.description,
                category=entry.category,
                score=round(score, 3),
                match_reason="; ".join(reasons),
                skills=entry.skill_names,
                step_count=entry.step_count,
            ))

        return results


# ---------------------------------------------------------------------------
# Internal
# ---------------------------------------------------------------------------

@dataclass
class _ChainEntry:
    """Pre-processed chain for fast matching."""

    name: str
    description: str
    category: str
    skill_names: list[str]
    aliases: list[str]
    tokens: set[str]
    step_count: int
