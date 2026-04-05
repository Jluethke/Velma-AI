"""
agent_social.py
===============

Agent-to-agent interaction layer. Enables messaging, collaboration,
bounties, and social features between SkillChain nodes.

Local storage backend (``~/.skillchain/social/``) for development.
Production will use P2P protocol or on-chain storage.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_MAX_BIO = 280

REPUTATION_TIERS = [
    ("legend", 100, 0.9),
    ("master", 51, 0.85),
    ("expert", 21, 0.7),
    ("contributor", 6, 0.5),
    ("newcomer", 0, 0.0),
]


def compute_reputation_tier(
    skills_published: int,
    trust_score: float,
    validation_accuracy: float = 1.0,
) -> str:
    """Derive the reputation tier from contribution metrics."""
    for tier, min_skills, min_trust in REPUTATION_TIERS:
        if skills_published >= min_skills and trust_score >= min_trust:
            # expert additionally requires 80% validation accuracy
            if tier == "expert" and validation_accuracy < 0.8:
                continue
            return tier
    return "newcomer"


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uuid() -> str:
    return uuid.uuid4().hex[:16]


@dataclass
class AgentProfile:
    node_id: str
    display_name: str
    bio: str  # 280 chars max
    domains: list[str]
    skills_published: int = 0
    skills_validated: int = 0
    trust_score: float = 0.0
    chains_published: list[str] = field(default_factory=list)
    member_since: str = ""
    last_active: str = ""
    reputation_tier: str = "newcomer"
    total_earned: float = 0.0
    validation_accuracy: float = 0.0
    role: str = ""        # founder, developer, designer, analyst, marketer, creator
    goals: list[str] = field(default_factory=list)
    skill_names: list[str] = field(default_factory=list)  # names of published skills


@dataclass
class SkillBounty:
    bounty_id: str
    creator_node_id: str
    title: str
    description: str
    domain: str
    reward_trust: float
    required_execution_pattern: str = "orpa"
    deadline: str = ""
    status: str = "open"  # open, claimed, submitted, completed, expired
    claimed_by: Optional[str] = None
    submission_skill_id: Optional[str] = None


@dataclass
class AgentMessage:
    msg_id: str
    from_node: str
    to_node: str
    msg_type: str  # direct, collaboration_request, bounty_claim, review_request, chain_invite
    subject: str
    body: str
    timestamp: str = ""
    read: bool = False
    reply_to: Optional[str] = None


@dataclass
class CollaborationRequest:
    collab_id: str
    chain_name: str
    initiator_node: str
    participants: dict[str, list[str]]  # node_id -> step aliases
    status: str = "proposed"  # proposed, accepted, in_progress, completed, declined
    chain_definition: dict = field(default_factory=dict)
    shared_context: dict = field(default_factory=dict)


@dataclass
class AgentMatch:
    node_id: str
    display_name: str
    match_score: float  # 0-1
    match_reasons: list[str]
    complementary_skills: list[str]
    potential_chains: list[str]
    trust_compatibility: float


@dataclass
class SuggestedTeam:
    team_name: str
    members: list[AgentMatch]
    combined_skills: list[str]
    achievable_chains: list[str]
    team_score: float


@dataclass
class ActivityEvent:
    event_type: str  # skill_published, skill_validated, bounty_created, bounty_completed, chain_run, node_joined
    node_id: str
    node_name: str
    description: str
    timestamp: str = ""
    data: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Persistence helpers
# ---------------------------------------------------------------------------

def _social_dir() -> Path:
    d = Path.home() / ".skillchain" / "social"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _load_json(path: Path) -> Any:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


def _sanitize_id(value: str) -> str:
    """Sanitize an ID for safe use as a filename.

    Strips directory separators, '..' sequences, and null bytes.
    """
    safe = value.replace("\0", "").replace("/", "").replace("\\", "")
    while ".." in safe:
        safe = safe.replace("..", "")
    safe = safe.lstrip(".")
    return safe or "_invalid"


# ---------------------------------------------------------------------------
# SocialManager
# ---------------------------------------------------------------------------

class SocialManager:
    """Agent-to-agent social interaction manager.

    Manages profiles, messaging, bounties, collaborations, and network
    activity. Stores data locally in ``~/.skillchain/social/``.
    """

    def __init__(self, config=None, chain_client=None):
        self._config = config
        self._chain_client = chain_client
        self._base = _social_dir()
        self._profiles_dir = self._base / "profiles"
        self._messages_dir = self._base / "messages"
        self._bounties_dir = self._base / "bounties"
        self._collabs_dir = self._base / "collaborations"
        self._activity_path = self._base / "activity.json"

        for d in (self._profiles_dir, self._messages_dir,
                  self._bounties_dir, self._collabs_dir):
            d.mkdir(parents=True, exist_ok=True)

    # -- own node id -----------------------------------------------------------

    @property
    def _node_id(self) -> str:
        if self._config and hasattr(self._config, "node_id"):
            return self._config.node_id
        # Fallback: read from config dir
        cfg_path = Path.home() / ".skillchain" / "config.json"
        data = _load_json(cfg_path)
        if data and "node_id" in data:
            return data["node_id"]
        return "local-node"

    # ── Profile ──────────────────────────────────────────────────────────

    def get_profile(self, node_id: str | None = None) -> AgentProfile:
        """Load a profile. Defaults to the local node."""
        nid = _sanitize_id(node_id or self._node_id)
        path = self._profiles_dir / f"{nid}.json"
        data = _load_json(path)
        if data:
            return AgentProfile(**data)
        # Return a default empty profile
        return AgentProfile(
            node_id=nid,
            display_name=nid,
            bio="",
            domains=[],
            member_since=_now_iso(),
            last_active=_now_iso(),
        )

    def update_profile(
        self,
        display_name: str | None = None,
        bio: str | None = None,
        domains: list[str] | None = None,
    ) -> AgentProfile:
        """Update the local node's profile."""
        profile = self.get_profile()
        if display_name is not None:
            profile.display_name = display_name
        if bio is not None:
            profile.bio = bio[:_MAX_BIO]
        if domains is not None:
            profile.domains = domains
        profile.last_active = _now_iso()
        profile.reputation_tier = compute_reputation_tier(
            profile.skills_published, profile.trust_score, profile.validation_accuracy,
        )
        self._save_profile(profile)
        return profile

    def _save_profile(self, profile: AgentProfile) -> None:
        path = self._profiles_dir / f"{_sanitize_id(profile.node_id)}.json"
        _save_json(path, asdict(profile))

    # ── Messaging ────────────────────────────────────────────────────────

    def send_message(
        self,
        to_node: str,
        msg_type: str,
        subject: str,
        body: str,
        reply_to: str | None = None,
    ) -> AgentMessage:
        """Send a message to another node."""
        msg = AgentMessage(
            msg_id=_uuid(),
            from_node=self._node_id,
            to_node=to_node,
            msg_type=msg_type,
            subject=subject,
            body=body,
            timestamp=_now_iso(),
            read=False,
            reply_to=reply_to,
        )
        # Store in recipient's mailbox
        mailbox = self._messages_dir / _sanitize_id(to_node)
        mailbox.mkdir(parents=True, exist_ok=True)
        _save_json(mailbox / f"{_sanitize_id(msg.msg_id)}.json", asdict(msg))

        # Also store in sender's sent folder
        sent = self._messages_dir / _sanitize_id(self._node_id) / "sent"
        sent.mkdir(parents=True, exist_ok=True)
        _save_json(sent / f"{_sanitize_id(msg.msg_id)}.json", asdict(msg))

        self._emit_activity("message_sent", self._node_id,
                            self.get_profile().display_name,
                            f"Sent a {msg_type} message to {to_node}")
        return msg

    def get_inbox(self, unread_only: bool = False) -> list[AgentMessage]:
        """Get messages for the local node."""
        mailbox = self._messages_dir / _sanitize_id(self._node_id)
        if not mailbox.exists():
            return []
        messages = []
        for f in sorted(mailbox.glob("*.json")):
            data = _load_json(f)
            if data:
                msg = AgentMessage(**data)
                if unread_only and msg.read:
                    continue
                messages.append(msg)
        messages.sort(key=lambda m: m.timestamp, reverse=True)
        return messages

    def mark_read(self, msg_id: str) -> None:
        """Mark a message as read."""
        mailbox = self._messages_dir / _sanitize_id(self._node_id)
        path = mailbox / f"{_sanitize_id(msg_id)}.json"
        data = _load_json(path)
        if data:
            data["read"] = True
            _save_json(path, data)

    def reply(self, msg_id: str, body: str) -> AgentMessage:
        """Reply to a message."""
        mailbox = self._messages_dir / _sanitize_id(self._node_id)
        path = mailbox / f"{_sanitize_id(msg_id)}.json"
        data = _load_json(path)
        if not data:
            raise ValueError(f"Message {msg_id} not found")
        original = AgentMessage(**data)
        self.mark_read(msg_id)
        return self.send_message(
            to_node=original.from_node,
            msg_type=original.msg_type,
            subject=f"Re: {original.subject}",
            body=body,
            reply_to=msg_id,
        )

    # ── Bounties ─────────────────────────────────────────────────────────

    def create_bounty(
        self,
        title: str,
        description: str,
        domain: str,
        reward: float,
        deadline: str,
        required_execution_pattern: str = "orpa",
    ) -> SkillBounty:
        """Create a new skill bounty."""
        bounty = SkillBounty(
            bounty_id=_uuid(),
            creator_node_id=self._node_id,
            title=title,
            description=description,
            domain=domain,
            reward_trust=reward,
            required_execution_pattern=required_execution_pattern,
            deadline=deadline,
            status="open",
        )
        _save_json(self._bounties_dir / f"{_sanitize_id(bounty.bounty_id)}.json", asdict(bounty))
        self._emit_activity("bounty_created", self._node_id,
                            self.get_profile().display_name,
                            f"Posted bounty: {title} ({reward} TRUST)",
                            {"bounty_id": bounty.bounty_id, "reward": reward})
        return bounty

    def list_bounties(
        self, domain: str | None = None, status: str = "open",
    ) -> list[SkillBounty]:
        """List bounties, optionally filtered."""
        bounties = []
        for f in self._bounties_dir.glob("*.json"):
            data = _load_json(f)
            if data:
                b = SkillBounty(**data)
                if status and b.status != status:
                    continue
                if domain and b.domain != domain:
                    continue
                bounties.append(b)
        bounties.sort(key=lambda b: b.reward_trust, reverse=True)
        return bounties

    def claim_bounty(self, bounty_id: str) -> SkillBounty:
        """Claim an open bounty."""
        bounty = self._load_bounty(bounty_id)
        if bounty.status != "open":
            raise ValueError(f"Bounty {bounty_id} is not open (status={bounty.status})")
        bounty.status = "claimed"
        bounty.claimed_by = self._node_id
        self._save_bounty(bounty)
        self._emit_activity("bounty_claimed", self._node_id,
                            self.get_profile().display_name,
                            f"Claimed bounty: {bounty.title}")
        return bounty

    def submit_bounty(self, bounty_id: str, skill_id: str) -> SkillBounty:
        """Submit a skill to fulfill a bounty."""
        bounty = self._load_bounty(bounty_id)
        if bounty.status != "claimed":
            raise ValueError(f"Bounty {bounty_id} is not claimed (status={bounty.status})")
        if bounty.claimed_by != self._node_id:
            raise ValueError("Only the claimant can submit")
        bounty.status = "submitted"
        bounty.submission_skill_id = skill_id
        self._save_bounty(bounty)
        self._emit_activity("skill_submitted", self._node_id,
                            self.get_profile().display_name,
                            f"Submitted skill for bounty: {bounty.title}")
        return bounty

    def complete_bounty(self, bounty_id: str) -> SkillBounty:
        """Approve a bounty submission, releasing reward."""
        bounty = self._load_bounty(bounty_id)
        if bounty.status != "submitted":
            raise ValueError(f"Bounty {bounty_id} is not submitted (status={bounty.status})")
        if bounty.creator_node_id != self._node_id:
            raise ValueError("Only the creator can complete a bounty")
        bounty.status = "completed"
        self._save_bounty(bounty)

        # Credit the claimant's profile
        if bounty.claimed_by:
            claimant = self.get_profile(bounty.claimed_by)
            claimant.total_earned += bounty.reward_trust
            self._save_profile(claimant)

        self._emit_activity("bounty_completed", self._node_id,
                            self.get_profile().display_name,
                            f"Completed bounty: {bounty.title} ({bounty.reward_trust} TRUST paid)",
                            {"bounty_id": bounty_id, "reward": bounty.reward_trust})
        return bounty

    def expire_bounty(self, bounty_id: str) -> SkillBounty:
        """Expire a bounty past its deadline."""
        bounty = self._load_bounty(bounty_id)
        if bounty.status not in ("open", "claimed"):
            raise ValueError(f"Cannot expire bounty in status={bounty.status}")
        bounty.status = "expired"
        self._save_bounty(bounty)
        return bounty

    def _load_bounty(self, bounty_id: str) -> SkillBounty:
        path = self._bounties_dir / f"{_sanitize_id(bounty_id)}.json"
        data = _load_json(path)
        if not data:
            raise ValueError(f"Bounty {bounty_id} not found")
        return SkillBounty(**data)

    def _save_bounty(self, bounty: SkillBounty) -> None:
        _save_json(self._bounties_dir / f"{_sanitize_id(bounty.bounty_id)}.json", asdict(bounty))

    # ── Collaboration ────────────────────────────────────────────────────

    def propose_collaboration(
        self,
        chain_name: str,
        chain_def: dict,
        participant_assignments: dict[str, list[str]],
    ) -> CollaborationRequest:
        """Propose a collaborative chain execution."""
        collab = CollaborationRequest(
            collab_id=_uuid(),
            chain_name=chain_name,
            initiator_node=self._node_id,
            participants=participant_assignments,
            status="proposed",
            chain_definition=chain_def,
            shared_context={},
        )
        _save_json(self._collabs_dir / f"{_sanitize_id(collab.collab_id)}.json", asdict(collab))

        # Send invitations
        for node_id in participant_assignments:
            if node_id != self._node_id:
                self.send_message(
                    to_node=node_id,
                    msg_type="chain_invite",
                    subject=f"Collaboration invite: {chain_name}",
                    body=f"You're invited to collaborate on chain '{chain_name}'. "
                         f"Your steps: {', '.join(participant_assignments[node_id])}",
                )

        self._emit_activity("collaboration_proposed", self._node_id,
                            self.get_profile().display_name,
                            f"Proposed collaboration: {chain_name}")
        return collab

    def accept_collaboration(self, collab_id: str) -> CollaborationRequest:
        """Accept a collaboration request."""
        collab = self._load_collab(collab_id)
        if collab.status != "proposed":
            raise ValueError(f"Collaboration {collab_id} is not in proposed state")
        collab.status = "accepted"
        self._save_collab(collab)
        self._emit_activity("collaboration_accepted", self._node_id,
                            self.get_profile().display_name,
                            f"Accepted collaboration: {collab.chain_name}")
        return collab

    def decline_collaboration(self, collab_id: str) -> CollaborationRequest:
        """Decline a collaboration request."""
        collab = self._load_collab(collab_id)
        if collab.status != "proposed":
            raise ValueError(f"Collaboration {collab_id} is not in proposed state")
        collab.status = "declined"
        self._save_collab(collab)
        return collab

    def get_collaboration(self, collab_id: str) -> CollaborationRequest:
        """Get a collaboration by ID."""
        return self._load_collab(collab_id)

    def _load_collab(self, collab_id: str) -> CollaborationRequest:
        path = self._collabs_dir / f"{_sanitize_id(collab_id)}.json"
        data = _load_json(path)
        if not data:
            raise ValueError(f"Collaboration {collab_id} not found")
        return CollaborationRequest(**data)

    def _save_collab(self, collab: CollaborationRequest) -> None:
        _save_json(self._collabs_dir / f"{_sanitize_id(collab.collab_id)}.json", asdict(collab))

    # ── Activity Feed ────────────────────────────────────────────────────

    def _emit_activity(
        self,
        event_type: str,
        node_id: str,
        node_name: str,
        description: str,
        data: dict | None = None,
    ) -> ActivityEvent:
        event = ActivityEvent(
            event_type=event_type,
            node_id=node_id,
            node_name=node_name,
            description=description,
            timestamp=_now_iso(),
            data=data or {},
        )
        # Append to activity log
        events = _load_json(self._activity_path) or []
        events.append(asdict(event))
        # Keep last 500 events
        events = events[-500:]
        _save_json(self._activity_path, events)
        return event

    def get_network_activity(self, limit: int = 50) -> list[ActivityEvent]:
        """Return recent network activity events."""
        events = _load_json(self._activity_path) or []
        result = [ActivityEvent(**e) for e in events[-limit:]]
        result.reverse()
        return result

    # ── Discovery ────────────────────────────────────────────────────────

    def search_agents(
        self,
        domain: str | None = None,
        min_trust: float = 0.0,
    ) -> list[AgentProfile]:
        """Search for agents by domain and minimum trust."""
        agents = []
        for f in self._profiles_dir.glob("*.json"):
            data = _load_json(f)
            if not data:
                continue
            profile = AgentProfile(**data)
            if min_trust and profile.trust_score < min_trust:
                continue
            if domain and domain not in profile.domains:
                continue
            agents.append(profile)
        agents.sort(key=lambda a: a.trust_score, reverse=True)
        return agents

    def get_leaderboard(
        self,
        domain: str | None = None,
        limit: int = 20,
    ) -> list[AgentProfile]:
        """Get top agents ranked by trust score."""
        agents = self.search_agents(domain=domain)
        return agents[:limit]

    # ── Matching & Recommendations ───────────────────────────────────────

    # Complementary role pairs (bidirectional)
    _COMPLEMENTARY_ROLES: list[tuple[str, str]] = [
        ("founder", "developer"),
        ("founder", "marketer"),
        ("developer", "designer"),
        ("analyst", "developer"),
        ("creator", "marketer"),
        ("developer", "marketer"),
        ("designer", "marketer"),
        ("analyst", "designer"),
    ]

    def _role_alignment(self, role_a: str, role_b: str) -> float:
        """Score goal/role alignment between two agents."""
        if not role_a or not role_b:
            return 0.0
        ra, rb = role_a.lower(), role_b.lower()
        if ra == rb:
            return 0.5  # Same role = moderate alignment
        for a, b in self._COMPLEMENTARY_ROLES:
            if (ra == a and rb == b) or (ra == b and rb == a):
                return 1.0
        return 0.1

    def _skill_complementarity(
        self, my_skills: list[str], their_skills: list[str],
    ) -> tuple[float, list[str]]:
        """Score how well their skills complement mine. Returns (score, complementary_list)."""
        my_set = set(s.lower() for s in my_skills)
        their_set = set(s.lower() for s in their_skills)
        if not my_set and not their_set:
            return 0.0, []
        # Skills they have that I don't
        complementary = their_set - my_set
        if not their_set:
            return 0.0, list(complementary)
        score = len(complementary) / max(len(their_set), 1)
        return min(score, 1.0), list(complementary)

    def _domain_overlap(self, domains_a: list[str], domains_b: list[str]) -> float:
        """Score domain overlap."""
        if not domains_a or not domains_b:
            return 0.0
        sa = set(d.lower() for d in domains_a)
        sb = set(d.lower() for d in domains_b)
        overlap = sa & sb
        union = sa | sb
        return len(overlap) / len(union) if union else 0.0

    def _trust_compatibility(self, trust_a: float, trust_b: float) -> float:
        """Score trust compatibility (within 0.2 = 1.0, decreasing beyond)."""
        diff = abs(trust_a - trust_b)
        if diff <= 0.2:
            return 1.0
        return max(0.0, 1.0 - (diff - 0.2) / 0.8)

    def find_matches(self, profile: AgentProfile | None = None) -> list[AgentMatch]:
        """Find complementary agents for the given (or local) profile."""
        me = profile or self.get_profile()
        all_agents = self.search_agents()
        matches = []

        for agent in all_agents:
            if agent.node_id == me.node_id:
                continue

            # 1. Skill Complementarity (40%)
            comp_score, comp_skills = self._skill_complementarity(
                me.skill_names, agent.skill_names,
            )

            # 2. Goal/Role Alignment (25%)
            alignment = self._role_alignment(me.role, agent.role)

            # 3. Domain Overlap (20%)
            domain_score = self._domain_overlap(me.domains, agent.domains)

            # 4. Trust Compatibility (15%)
            trust_compat = self._trust_compatibility(me.trust_score, agent.trust_score)

            total = (comp_score * 0.4 + alignment * 0.25
                     + domain_score * 0.2 + trust_compat * 0.15)

            reasons = []
            if comp_score > 0.3:
                reasons.append(f"Complementary skills: {', '.join(comp_skills[:3])}")
            if alignment >= 0.5:
                reasons.append(f"Role synergy: {me.role} + {agent.role}")
            if domain_score > 0.3:
                shared = set(d.lower() for d in me.domains) & set(d.lower() for d in agent.domains)
                reasons.append(f"Shared domains: {', '.join(shared)}")
            if trust_compat >= 0.8:
                reasons.append("Trust-compatible")

            # Potential chain combos
            potential_chains = []
            combined = set(me.skill_names) | set(agent.skill_names)
            if len(combined) >= 3:
                potential_chains.append(f"chain-{me.node_id[:4]}-{agent.node_id[:4]}")

            matches.append(AgentMatch(
                node_id=agent.node_id,
                display_name=agent.display_name,
                match_score=round(total, 3),
                match_reasons=reasons,
                complementary_skills=comp_skills[:5],
                potential_chains=potential_chains,
                trust_compatibility=round(trust_compat, 3),
            ))

        matches.sort(key=lambda m: m.match_score, reverse=True)
        return matches

    def suggest_teams(self, max_teams: int = 5) -> list[SuggestedTeam]:
        """Suggest multi-agent teams based on complementary skills and roles."""
        me = self.get_profile()
        matches = self.find_matches(me)
        if len(matches) < 2:
            return []

        _TEAM_NAMES = [
            "Alpha Strike Force", "Neural Collective", "Crypto Launch Squad",
            "Data Fusion Team", "Signal Syndicate", "Code Architects",
            "Market Makers Guild", "Design Forge", "Content Cartel",
            "Trust Alliance", "Chain Builders", "Insight Assembly",
        ]

        teams: list[SuggestedTeam] = []
        used_combos: set[frozenset[str]] = set()

        # Greedy: pair top matches into 3-member teams
        for i, m1 in enumerate(matches[:8]):
            for m2 in matches[i + 1:8]:
                combo = frozenset([m1.node_id, m2.node_id])
                if combo in used_combos:
                    continue
                used_combos.add(combo)

                combined_skills = list(set(
                    me.skill_names + m1.complementary_skills + m2.complementary_skills
                ))
                team_score = round((m1.match_score + m2.match_score) / 2, 3)
                achievable = []
                if len(combined_skills) >= 3:
                    achievable.append(f"pipeline-{len(combined_skills)}-step")

                name_idx = len(teams) % len(_TEAM_NAMES)
                teams.append(SuggestedTeam(
                    team_name=_TEAM_NAMES[name_idx],
                    members=[m1, m2],
                    combined_skills=combined_skills[:10],
                    achievable_chains=achievable,
                    team_score=team_score,
                ))
                if len(teams) >= max_teams:
                    break
            if len(teams) >= max_teams:
                break

        teams.sort(key=lambda t: t.team_score, reverse=True)
        return teams
