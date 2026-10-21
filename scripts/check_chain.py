"""Validate one FlowFabric chain and every flow it references.

Usage: python check_chain.py <chain-name> <flow-prefix>
Exit 0 and print ALL OK when clean; otherwise print each problem and exit 1.
"""
import json
import os
import re
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
PHASE = re.compile(r"^##\s+(?:Phase\s+\d+[:.]\s*|(\d+)\.\s*)(.+)", re.I)  # skill-evolution.ts
BANNED = ["\u2014", "Jeep", "Velma", "WK2", "openpilot", "comma.ai", "panda", "Wayfinder Systems"]
HYPE = ["compelling", "transformative", "powerful", "comprehensive", "robust", "cutting-edge",
        "leverages", "empowers", "unlocks", "seamless", "seamlessly", "game-changing"]
BRIT = ["colour", "behaviour", "optimis", "centre", "metre", "favour", "modell",
        "initialis", "serialis", "normalis", "licence"]
BRIT_RE = [re.compile(r"analyse(?!s)")]
GOV_TERMS = [r"\bAPG\b", r"\bERI\b", r"\bALG\b", r"\bAAG\b", r"\bADG\b", r"\bCIP\b", "neuroprin", "koopman",
             "constraint_scale", "wayfinder governor", "velma governance", "earned autonomy", "foresight gate"]
FOOTER = "Copyright 2024-present The Wayfinder Trust. All rights reserved."
SECTIONS = ("## Inputs", "## Outputs", "## Worked Example", "## Exit Criteria", "## Error Handling",
            "### Entry Criteria", "### Actions", "### Output")


def check_flow(name, prefix):
    d = os.path.join(MKT, name)
    sk, mf = os.path.join(d, "skill.md"), os.path.join(d, "manifest.json")
    if not (os.path.exists(sk) and os.path.exists(mf)):
        return None, ["missing skill.md or manifest.json"]
    prob = []
    try:
        m = json.load(open(mf, encoding="utf-8"))
    except ValueError as e:
        return None, ["manifest not valid JSON: %s" % e]
    s = open(sk, encoding="utf-8").read()
    low = s.lower()
    if not name.startswith(prefix):
        prob.append("flow name must start with prefix %r" % prefix)
    if m.get("name") != name:
        prob.append("manifest name %r != dir name" % m.get("name"))
    VALID_PATTERNS = {"phase_pipeline", "orpa", "linear", "iterative", "branching"}
    VALID_LICENSES = {"OPEN", "COMMERCIAL", "PRIVATE"}
    ep = m.get("execution_pattern", "")
    if ep not in VALID_PATTERNS:
        prob.append("manifest execution_pattern=%r, want one of %s" % (ep, VALID_PATTERNS))
    lic = m.get("license", "")
    if lic not in VALID_LICENSES:
        prob.append("manifest license=%r, want one of %s" % (lic, VALID_LICENSES))
    price = m.get("price")
    if price is None:
        prob.append("manifest missing price")
    elif lic == "OPEN" and str(price) != "0":
        prob.append("OPEN license must be price '0', got %r" % price)
    if not m.get("domain"):
        prob.append("manifest missing domain")
    for k in ("version", "tags", "inputs", "outputs", "description"):
        if k not in m:
            prob.append("manifest missing %s" % k)
    phases = [l for l in s.splitlines() if PHASE.match(l)]
    gates = len(re.findall(r"^### Quality Gate", s, re.M))
    if ep == "phase_pipeline":
        if not 2 <= len(phases) <= 4:
            prob.append("phases=%d (need 2 to 4 '## Phase N: Title' headings)" % len(phases))
        if gates != len(phases):
            prob.append("'### Quality Gate' count %d != phase count %d" % (gates, len(phases)))
    CORE_SECTIONS = ("## Inputs", "## Outputs")
    PHASE_SECTIONS = ("## Worked Example", "## Exit Criteria", "## Error Handling",
                      "### Entry Criteria", "### Actions", "### Output")
    for sec in CORE_SECTIONS:
        if sec not in s:
            prob.append("missing section '%s'" % sec)
    if ep == "phase_pipeline":
        for sec in PHASE_SECTIONS:
            if sec not in s:
                prob.append("missing section '%s'" % sec)
    for io in list(m.get("inputs", [])) + list(m.get("outputs", [])):
        io_name = io if isinstance(io, str) else io.get("name", str(io))
        if "`%s`" % io_name not in s:
            prob.append("io name `%s` never appears backticked in skill.md" % io_name)
    combined = s + json.dumps(m, ensure_ascii=False)
    for b in BANNED:
        pat = r"\b" + re.escape(b) + r"\b"
        if re.search(pat, combined):
            prob.append("banned text %r" % b)
    prob += ["hype word %r" % h for h in HYPE if re.search(r"\b%s\b" % re.escape(h), low)]
    # Proprietary governor vocabulary never appears in public flows.
    prob += ["proprietary term %r" % t for t in GOV_TERMS if re.search(t, s + json.dumps(m), re.I if t.islower() else 0)]
    prob += ["British spelling %r" % b for b in BRIT if b in low]
    prob += ["British spelling %r" % p.pattern for p in BRIT_RE if p.search(low)]
    if FOOTER not in s:
        prob.append("license footer missing")
    ALLOWED_FILES = {"skill.md", "manifest.json", "tests.json", "provenance.json", "examples"}
    extra = [x for x in os.listdir(d) if x not in ALLOWED_FILES]
    if extra:
        prob.append("unexpected files in flow dir: %s" % extra)
    return m, prob


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    cn, prefix = sys.argv[1], sys.argv[2]
    fails = []
    p = os.path.join(MKT, "chains", cn + ".chain.json")
    if not os.path.exists(p):
        print("no chain file %s" % p)
        sys.exit(1)
    raw = open(p, encoding="utf-8").read()
    try:
        c = json.loads(raw)
    except ValueError as e:
        print("chain not valid JSON: %s" % e)
        sys.exit(1)
    if "\u2014" in raw:
        fails.append("chain: em-dash")
    for k in ("name", "description", "steps", "edges", "entry_inputs", "terminal_outputs",
              "parallel_groups", "estimated_cost", "critical_path"):
        if k not in c:
            fails.append("chain missing key %s" % k)
    if c.get("name") != cn:
        fails.append("chain name %r != file name" % c.get("name"))
    steps = c.get("steps", [])
    if not 1 <= len(steps) <= 45:
        fails.append("chain has %d steps, need 1 to 45" % len(steps))
    ids = {}
    user_inputs = set()
    for st in steps:
        sid = st.get("id")
        if sid in ids:
            fails.append("duplicate step id %s" % sid)
        m, prob = check_flow(st.get("skill_name", ""), prefix)
        fails += ["%s: %s" % (st.get("skill_name"), x) for x in prob]
        ids[sid] = st
        if m is None:
            continue
        def _io_names(lst):
            return [x if isinstance(x, str) else x.get("name", str(x)) for x in (lst or [])]
        if list(st.get("inputs", {})) != _io_names(m.get("inputs")) or list(st.get("outputs", {})) != _io_names(m.get("outputs")):
            fails.append("%s: step inputs/outputs keys must equal manifest lists in order" % sid)
    for sid, st in ids.items():
        for k, v in st.get("inputs", {}).items():
            if not isinstance(v, str):
                continue
            if v in ("from_user_input", "from_user_input_optional"):
                user_inputs.add(k)
                continue
            src, _, field = v.partition(".")
            if src in ("from_context", "from_context_optional", "from_entry",
                       "from_entry_optional", "from_entry_input", "from_entry_input_optional",
                       "workflow_input"):
                continue
            if src not in ids:
                fails.append("%s.%s: refers to unknown step %r" % (sid, k, src))
            elif field not in ids[src].get("outputs", {}):
                fails.append("%s.%s: step %s has no output %r" % (sid, k, src, field))
            elif list(ids).index(src) >= list(ids).index(sid) and "max_loops" not in json.dumps(c["edges"]):
                fails.append("%s.%s: reads from a later step %s" % (sid, k, src))
    entry = set()
    for e in c.get("entry_inputs", []):
        if isinstance(e, str):
            entry.add(e.split(" (")[0])
        elif isinstance(e, dict):
            entry.add(e.get("name", ""))
    if user_inputs and not user_inputs.issubset(entry):
        fails.append("entry_inputs %s missing user-supplied inputs %s" % (sorted(entry), sorted(user_inputs - entry)))
    all_out = {o for st in ids.values() for o in st.get("outputs", {})}
    for t in c.get("terminal_outputs", []):
        tn = t if isinstance(t, str) else t.get("name", "") if isinstance(t, dict) else str(t)
        if tn not in all_out:
            fails.append("terminal output %r produced by no step" % tn)
    for e in c.get("edges", []):
        if e.get("from_step") not in ids or e.get("to_step") not in ids:
            fails.append("bad edge %s->%s" % (e.get("from_step"), e.get("to_step")))
        for k in ("data_type", "field_mapping"):
            if k not in e:
                fails.append("edge %s->%s missing %s" % (e.get("from_step"), e.get("to_step"), k))
    grouped = [x for g in c.get("parallel_groups", []) for x in g]
    unknown_grouped = set(grouped) - set(ids)
    if unknown_grouped:
        fails.append("parallel_groups references unknown steps: %s" % sorted(unknown_grouped))
    for x in c.get("critical_path", []):
        if x not in ids:
            fails.append("critical_path has unknown step %s" % x)
    # chain_links: optional cross-chain wiring
    cl = c.get("chain_links")
    if cl is not None:
        if not isinstance(cl, dict):
            fails.append("chain_links must be an object")
        else:
            valid_rels = {"feeds_into", "fed_by", "alternative", "complement",
                          "prerequisite", "follow_up"}
            for pre in cl.get("prerequisites", []):
                cname = pre.get("chain_name", "")
                pf = os.path.join(MKT, "chains", cname + ".chain.json")
                if not os.path.exists(pf):
                    fails.append("chain_links.prerequisites: chain %r not found" % cname)
                if not isinstance(pre.get("required_outputs", []), list):
                    fails.append("chain_links.prerequisites.required_outputs must be a list")
            for nxt in cl.get("next_chains", []):
                cname = nxt.get("chain_name", "")
                nf = os.path.join(MKT, "chains", cname + ".chain.json")
                if not os.path.exists(nf):
                    fails.append("chain_links.next_chains: chain %r not found" % cname)
                if not isinstance(nxt.get("provided_inputs", []), list):
                    fails.append("chain_links.next_chains.provided_inputs must be a list")
            for rel in cl.get("related_chains", []):
                cname = rel.get("chain_name", "")
                rf = os.path.join(MKT, "chains", cname + ".chain.json")
                if not os.path.exists(rf):
                    fails.append("chain_links.related_chains: chain %r not found" % cname)
                if rel.get("relationship", "") not in valid_rels:
                    fails.append("chain_links.related_chains: invalid relationship %r for %s"
                                 % (rel.get("relationship"), cname))
    print("chain %s: %d steps checked" % (cn, len(steps)))
    if fails:
        print("\n".join(fails))
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
