"""Build comprehensive domain-based link groups across the full chain library.
Writes link_specs_C.json with groups that add new pairs beyond link_specs.json."""
import json

idx = json.load(open("scripts/chain_index.json", encoding="utf-8"))
existing = json.load(open("scripts/link_specs.json", encoding="utf-8"))

linked_pairs = set()
for spec in existing:
    g = spec["group"]
    for i in range(len(g)):
        for j in range(i + 1, len(g)):
            linked_pairs.add(tuple(sorted([g[i], g[j]])))

domain_groups = {
    "financial-review": {
        "chains": ["money-review", "financial-independence-check", "payday-ops",
                    "daily-intel", "money-wake-up", "financial-reset"],
        "note": "Financial health and review chains"
    },
    "home-management": {
        "chains": ["home-ops", "home-maintenance-calendar", "new-homeowner",
                    "new-homeowner-setup", "household-ops-manual-creation-pipeline",
                    "seasonal-home-prep"],
        "note": "Home management and maintenance"
    },
    "vehicle-care": {
        "chains": ["vehicle-checkup", "car-trouble-to-fixed", "diagnostic-session",
                    "something-broke-on-the-car", "drive-session", "offroad-day",
                    "road-trip-ready", "towing-prep"],
        "note": "Vehicle maintenance, diagnosis, and trip prep"
    },
    "review-cadences": {
        "chains": ["master-daily", "master-weekly", "master-monthly",
                    "morning-launch", "morning-routine", "evening-shutdown",
                    "sunday-reset", "weekend-catchup", "monthly-full-review",
                    "quarterly-life-audit", "new-year-full-reset",
                    "life-weekly-review", "monthly-life-review"],
        "note": "Periodic life review and planning cadences"
    },
    "career-job": {
        "chains": ["get-hired", "job-search-blitz", "career-pivot",
                    "career-change-retraining", "layoff-recovery", "parent-relaunch",
                    "new-employee-ready", "manager-first-90"],
        "note": "Career transition, job search, and onboarding"
    },
    "marketing-launch": {
        "chains": ["product-launch", "product-launch-marketing", "market-launch",
                    "content-to-customers", "content-machine", "competitive-intel",
                    "competitive-intelligence-brief-generator", "outreach-engine",
                    "first-customers", "micro-business-launch"],
        "note": "Product launch, marketing, and customer acquisition"
    },
    "pricing-fundraise": {
        "chains": ["pricing-decision", "pricing-overhaul", "fundraise-prep",
                    "investor-pitch"],
        "note": "Pricing strategy and fundraising"
    },
    "code-audit": {
        "chains": ["code-quality", "full-audit", "security-audit", "legacy-rescue",
                    "codebase-takeover", "debug-and-fix", "verified-fix",
                    "open-source-launch", "team-onboarding"],
        "note": "Code quality, audits, and codebase understanding"
    },
    "project-setup": {
        "chains": ["new-project-kickoff", "api-to-production", "api-build",
                    "saas-launch"],
        "note": "Software project setup and API development"
    },
    "deal-diligence": {
        "chains": ["deal-underwriting", "franchise-evaluator", "property-due-diligence"],
        "note": "Deal evaluation and due diligence"
    },
    "patent-pipeline": {
        "chains": ["patent-filing-pipeline", "patent-drawing-pipeline"],
        "note": "Patent filing workflow"
    },
    "pcb-hardware": {
        "chains": ["pcb-fab", "pcb-layout", "pcb-review", "pcb-schematic",
                    "hardware-product-from-prompt"],
        "note": "PCB design and hardware product pipeline"
    },
    "health-wellness": {
        "chains": ["health-reset", "healthy-living-reset", "fitness-week",
                    "fitness-and-drive", "new-life-kickstart"],
        "note": "Health, fitness, and wellness"
    },
    "life-events-moving": {
        "chains": ["moving-complete", "moving-day-complete", "new-homeowner",
                    "new-homeowner-setup", "new-life-kickstart"],
        "note": "Moving and settling into a new home"
    },
    "estate-planning": {
        "chains": ["will-and-estate-basics", "end-of-life-planning", "inheritance-received"],
        "note": "Estate planning and inheritance"
    },
    "decision-making": {
        "chains": ["before-you-leap", "big-decision", "money-wake-up"],
        "note": "High-stakes decision making and reality checks"
    },
    "observability": {
        "chains": ["observability", "observability-prometheus-hygiene",
                    "observability-python-service", "observability-slo-alerting",
                    "observability-tracing"],
        "note": "Service observability and monitoring"
    },
    "incident-response": {
        "chains": ["incident-response", "incident-response-database-locks",
                    "incident-response-diagnosis", "incident-response-postmortem",
                    "incident-response-stabilize"],
        "note": "Production incident management lifecycle"
    },
    "payments": {
        "chains": ["payments-integration", "payments-integration-alt-providers",
                    "payments-integration-post-payment", "payments-integration-stripe-python",
                    "payments-integration-webhooks"],
        "note": "Payments engineering and integration"
    },
    "ml-evaluation": {
        "chains": ["llm-evaluation", "llm-evaluation-judge-calibration",
                    "llm-evaluation-node-promptfoo", "llm-evaluation-python-inspect",
                    "llm-evaluation-safety-redteam", "llm-evaluation-statistics"],
        "note": "LLM and ML evaluation pipelines"
    },
    "ml-training": {
        "chains": ["ml-training-pipeline", "ml-training-pipeline-data-splits",
                    "ml-training-pipeline-evaluation-report", "ml-training-pipeline-pytorch-wandb",
                    "ml-training-pipeline-sklearn-mlflow"],
        "note": "ML model training pipelines"
    },
    "ip-licensing": {
        "chains": ["ip-directed-search", "ip-licensing-outreach", "ip-social-campaign",
                    "insurance-license-pipeline"],
        "note": "IP and insurance licensing pipelines"
    },
    "meetings": {
        "chains": ["meeting-notes-to-action-items", "meeting-to-action"],
        "note": "Meeting follow-up and action extraction"
    },
    "small-biz-freelance": {
        "chains": ["micro-business-launch", "freelancer-toolkit", "financial-reset"],
        "note": "Small business and freelance tools"
    },
    "motion-planning": {
        "chains": ["motion-planning-control", "motion-planning-control-hardware-deploy",
                    "motion-planning-control-lateral-tracking", "motion-planning-control-longitudinal",
                    "motion-planning-control-mpc"],
        "note": "Vehicle motion planning and control systems"
    },
    "localization": {
        "chains": ["localization-fusion", "localization-fusion-evaluation",
                    "localization-fusion-lidar-mapping", "localization-fusion-python-filter",
                    "localization-fusion-ros2-gnss", "localization-fusion-wheel-odometry"],
        "note": "Vehicle localization and sensor fusion"
    },
    "perception": {
        "chains": ["perception-pipelines", "perception-pipelines-cpp-tensorrt",
                    "perception-pipelines-dataset-training", "perception-pipelines-lidar-fusion",
                    "perception-pipelines-python-tensorrt", "perception-pipelines-tracking"],
        "note": "Camera and lidar perception pipelines"
    },
    "mobile-dev": {
        "chains": ["mobile-development", "mobile-development-android",
                    "mobile-development-cross-platform-ui", "mobile-development-ios",
                    "mobile-development-offline-sync", "mobile-development-release-readiness"],
        "note": "Mobile app development lifecycle"
    },
    "money-ledger": {
        "chains": ["money-ledger-engineering", "money-ledger-engineering-ledger-core",
                    "money-ledger-engineering-node", "money-ledger-engineering-python",
                    "money-ledger-engineering-reconciliation-sync"],
        "note": "Financial ledger engineering"
    },
    "memory-leak": {
        "chains": ["memory-leak-hunt", "memory-leak-hunt-go", "memory-leak-hunt-javascript",
                    "memory-leak-hunt-jvm", "memory-leak-hunt-native", "memory-leak-hunt-python"],
        "note": "Memory leak detection and fixing"
    },
    "package-publish": {
        "chains": ["package-publishing", "package-publishing-npm", "package-publishing-python",
                    "package-publishing-rust", "package-publishing-semver"],
        "note": "Library packaging and publishing"
    },
    "perf-profiling": {
        "chains": ["performance-profiling", "performance-profiling-go",
                    "performance-profiling-jvm", "performance-profiling-node",
                    "performance-profiling-python", "performance-profiling-regression-guard"],
        "note": "Performance profiling and optimization"
    },
    "property-testing": {
        "chains": ["property-fuzz-testing", "property-fuzz-testing-go",
                    "property-fuzz-testing-native-fuzz", "property-fuzz-testing-python",
                    "property-fuzz-testing-stateful"],
        "note": "Property-based and fuzz testing"
    },
    "monolith": {
        "chains": ["monolith-decomposition", "monolith-decomposition-data-split",
                    "monolith-decomposition-go-boundary", "monolith-decomposition-node-boundary",
                    "monolith-decomposition-python-boundary", "monolith-decomposition-service-cutover"],
        "note": "Monolith decomposition and microservice extraction"
    },
    "lang-porting": {
        "chains": ["language-porting", "language-porting-c-to-rust",
                    "language-porting-golden-corpus", "language-porting-java-to-kotlin",
                    "language-porting-semantics-audit"],
        "note": "Cross-language codebase porting"
    },
    "input-validation": {
        "chains": ["input-validation-security", "input-validation-security-browser-output",
                    "input-validation-security-go", "input-validation-security-node",
                    "input-validation-security-python", "input-validation-security-server-injection"],
        "note": "Input validation and security hardening"
    },
    "kubernetes": {
        "chains": ["kubernetes-delivery", "kubernetes-delivery-crashloop-debug",
                    "kubernetes-delivery-gitops", "kubernetes-delivery-hardening",
                    "kubernetes-delivery-probes", "kubernetes-delivery-right-sizing"],
        "note": "Kubernetes deployment and operations"
    },
    "family-parenting": {
        "chains": ["new-parent-survival", "elder-care-setup", "family-ready",
                    "pet-care-complete", "pre-marriage-alignment"],
        "note": "Family, parenting, and household care"
    },
    "content-seo": {
        "chains": ["content-to-customers", "content-machine", "product-launch-marketing",
                    "market-launch"],
        "note": "Content marketing and SEO pipelines"
    },
    "life-reckoning": {
        "chains": ["am-i-okay", "new-year-real", "stuck-to-unstuck",
                    "new-year-full-reset", "quarterly-life-audit"],
        "note": "Life audit and personal reckoning"
    },
    "digital-tech-onboard": {
        "chains": ["digital-life-setup", "tech-confidence-builder", "learn-anything"],
        "note": "Technology learning and digital onboarding"
    },
    "fabric-cre": {
        "chains": ["fabric-cre-asset-lifecycle", "fabric-cre-deal",
                    "property-due-diligence"],
        "note": "Commercial real estate deals and diligence"
    },
    "fabric-healthcare": {
        "chains": ["fabric-clinical-pharma", "fabric-pharma-pipeline",
                    "medicare-medicaid-navigator"],
        "note": "Healthcare, pharma, and benefits navigation"
    },
    "immigration-new-life": {
        "chains": ["immigration-prep", "new-life-kickstart", "moving-complete"],
        "note": "Major life transition and relocation"
    },
    "neighborhood-community": {
        "chains": ["neighborhood-organizer", "volunteer-coordinator"],
        "note": "Community organizing and volunteering"
    },
}

output = []
for key, g in sorted(domain_groups.items()):
    valid = [c for c in g["chains"] if c in idx]
    if len(valid) >= 2:
        new_pairs = 0
        for i in range(len(valid)):
            for j in range(i + 1, len(valid)):
                pair = tuple(sorted([valid[i], valid[j]]))
                if pair not in linked_pairs:
                    new_pairs += 1
        if new_pairs > 0:
            output.append({"group": valid, "note": g["note"]})

total_new_pairs = 0
for g in output:
    pairs = 0
    for i in range(len(g["group"])):
        for j in range(i + 1, len(g["group"])):
            pair = tuple(sorted([g["group"][i], g["group"][j]]))
            if pair not in linked_pairs:
                pairs += 1
    total_new_pairs += pairs
    print(g["note"] + ": " + str(len(g["group"])) + " chains, " + str(pairs) + " new pairs")

print("")
print("New link groups: " + str(len(output)))
print("Total new pairs: " + str(total_new_pairs))

with open("scripts/link_specs_C.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("Written to scripts/link_specs_C.json")
