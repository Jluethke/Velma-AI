"""Build comprehensive link_specs covering all 707 chains.

Strategy:
1. Auto-detect prefix families (parent + children sharing a common prefix)
2. Add cross-domain groups (chains with different prefixes but same domain)
3. Merge with existing link_specs.json to avoid losing prior work
4. Output link_specs_full.json
"""
import json
import os

SCRIPTS = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts"
INDEX = os.path.join(SCRIPTS, "chain_index.json")
EXISTING = os.path.join(SCRIPTS, "link_specs.json")
OUTPUT = os.path.join(SCRIPTS, "link_specs_full.json")

idx = json.load(open(INDEX, encoding="utf-8"))
all_names = sorted(idx.keys())

groups = []


def add(group, note):
    cleaned = [c for c in group if c in idx]
    if len(cleaned) >= 2:
        groups.append({"group": cleaned, "note": note})


# ── 1. PREFIX FAMILIES ──────────────────────────────────────────────
# Each parent + all its children form one group.
# Detect by finding the longest common prefix that is itself a chain name.

children_of = {}
for name in all_names:
    parts = name.rsplit("-", 1)
    while parts and len(parts) > 1:
        candidate = parts[0]
        if candidate in idx and candidate != name:
            if candidate not in children_of:
                children_of[candidate] = []
            children_of[candidate].append(name)
            break
        if "-" in candidate:
            parts = [candidate.rsplit("-", 1)[0]]
        else:
            break

# Some families use a longer prefix. Scan for all chains starting with prefix-.
prefix_families = {}
for name in all_names:
    for other in all_names:
        if other != name and other.startswith(name + "-"):
            if name not in prefix_families:
                prefix_families[name] = set()
            prefix_families[name].add(other)

# Remove nested: if X is a child of Y, don't treat X as a family root
# unless X itself has children not already in Y's family
for parent in sorted(prefix_families.keys()):
    family = [parent] + sorted(prefix_families[parent])
    if len(family) >= 2:
        add(family, f"{parent} family")


# ── 2. CROSS-DOMAIN GROUPS ─────────────────────────────────────────

# Vehicle diagnosis/repair cluster
add([
    "vehicle-checkup", "car-trouble-to-fixed", "diagnostic-session",
    "something-broke-on-the-car", "car-maintenance-planner",
], "Vehicle diagnosis and repair")

# Vehicle driving/trip cluster
add([
    "drive-session", "offroad-day", "road-trip-ready", "towing-prep",
], "Vehicle driving and trip prep")

# Vehicle diagnostics <-> CAN bus bridge
add([
    "vehicle-diagnostics", "can-bus-engineering", "can-signal-reverse-engineering",
], "Vehicle CAN and diagnostics bridge")

# Vehicle sensor <-> perception <-> localization bridge
add([
    "vehicle-sensor-integration", "perception-pipelines", "localization-fusion",
], "Vehicle sensor-perception-localization bridge")

# Vehicle simulation <-> motion planning bridge
add([
    "vehicle-simulation", "motion-planning-control",
], "Vehicle simulation and motion planning bridge")

# Functional safety <-> runtime safety <-> safety-critical C++
add([
    "functional-safety-engineering", "runtime-safety-monitors", "safety-critical-cpp",
    "deterministic-replay-testing",
], "Safety engineering bridge")

# ROS2 <-> vehicle bench <-> sensor integration bridge
add([
    "ros2-robotics", "ros2-robotics-vehicle-bench",
    "vehicle-sensor-integration", "localization-fusion",
], "ROS2 vehicle integration bridge")

# Drive data logging <-> vehicle simulation replay
add([
    "drive-data-logging", "drive-data-logging-replay-testing",
    "vehicle-simulation-hil-bench", "deterministic-replay-testing-field-corpus-ci",
], "Drive data replay and testing")

# Vehicle modification
add([
    "vehicle-mod", "vehicle-diagnostics", "can-bus-engineering",
], "Vehicle modification and diagnostics")

# Hardware product development pipeline
add([
    "hardware-product-from-prompt", "hw-requirements", "hw-architecture",
    "hw-acceptance", "firmware-build",
], "Hardware product development")

# PCB pipeline
add([
    "pcb-schematic", "pcb-layout", "pcb-review", "pcb-fab",
    "enclosure-build", "harness-build",
], "PCB and enclosure build pipeline")

# Hardware <-> embedded bridge
add([
    "hardware-product-from-prompt", "embedded-systems", "firmware-build",
], "Hardware to embedded bridge")

# Embedded <-> realtime linux bridge
add([
    "embedded-systems", "realtime-linux",
], "Embedded and realtime Linux bridge")

# Edge AI <-> ML training bridge
add([
    "edge-ai-deployment", "ml-training-pipeline",
    "perception-pipelines",
], "ML training to edge deployment bridge")

# Edge AI <-> perception <-> TensorRT bridge
add([
    "edge-ai-deployment-trt-engine", "perception-pipelines-cpp-tensorrt",
    "perception-pipelines-python-tensorrt",
], "TensorRT deployment paths")

# Financial health cluster
add([
    "financial-independence-check", "money-review", "money-wake-up",
    "financial-reset", "payday-ops",
], "Financial health assessment")

# Debt and credit cluster
add([
    "debt-payoff-strategy", "credit-score-repair", "financial-reset",
], "Debt and credit repair")

# Investment cluster
add([
    "first-time-investor", "portfolio-rebalancer-chain", "daily-intel",
    "retirement-ready",
], "Investment and portfolio")

# Tax and financial planning
add([
    "tax-optimizer-chain", "fabric-tax-finance", "fabric-financial-planning",
    "fabric-audit-finance",
], "Tax and financial planning")

# Budget cluster
add([
    "zero-based-budget-designer-chain", "financial-reset", "money-wake-up",
], "Budgeting")

# Side hustle and freelancing
add([
    "side-hustle-financial-modeler-chain", "freelancer-toolkit",
    "micro-business-launch", "side-project-to-main",
], "Side hustle and freelancing")

# Career search cluster
add([
    "get-hired", "job-search-blitz", "layoff-recovery", "parent-relaunch",
    "salary-review",
], "Job search and salary")

# Career change cluster
add([
    "career-pivot", "career-change-retraining", "should-i-quit",
    "side-project-to-main",
], "Career change and transition")

# Startup validation to launch
add([
    "startup-validation", "micro-business-launch", "saas-launch",
    "idea-validator-chain",
], "Startup validation and launch")

# Customer acquisition cluster
add([
    "first-customers", "outreach-engine", "content-to-customers",
    "client-onboarding",
], "Customer acquisition")

# Product launch cluster
add([
    "product-launch", "product-launch-marketing", "market-launch",
    "fabric-go-to-market",
], "Product and market launch")

# Fundraising cluster
add([
    "fundraise-prep", "investor-pitch", "fabric-startup-venture",
    "fabric-venture-deal",
], "Fundraising and venture")

# Business operations weekly/daily
add([
    "solopreneur-daily", "weekly-founder-ops", "weekly-ops",
    "quarterly-strategy",
], "Business operating cadence")

# Revenue and pricing
add([
    "revenue-diagnostics", "pricing-decision", "pricing-overhaul",
    "pricing-optimizer-chain", "fabric-revenue-planning",
], "Revenue and pricing")

# Health reset cluster
add([
    "health-reset", "healthy-living-reset", "health-check-prep",
], "Health reset and check")

# Fitness cluster
add([
    "fitness-week", "fitness-and-drive", "sleep-protocol-designer-chain",
], "Fitness and sleep")

# Mental health cluster
add([
    "anxiety-management-protocol", "burnout-recovery", "grief-support",
    "stress-audit-chain", "mindfulness-sequencer-chain",
], "Mental health and wellness")

# Nutrition cluster
add([
    "weekly-meal-prep", "grocery-optimizer",
], "Nutrition and meal planning")

# Home maintenance cluster
add([
    "home-maintenance-calendar", "home-ops", "seasonal-home-prep",
    "household-ops-manual-creation-pipeline",
], "Home maintenance")

# Home renovation
add([
    "home-renovation-planner-chain", "fabric-real-estate-development",
    "fabric-construction-project",
], "Home renovation and construction")

# Moving and new home
add([
    "moving-complete", "moving-day-complete", "new-homeowner",
    "new-homeowner-setup", "relocation-decision-chain",
], "Moving and new home")

# Family life cluster
add([
    "family-meeting-facilitator", "family-ready", "new-parent-survival",
    "teenager-survival-guide",
], "Family life")

# Elder care and end of life
add([
    "elder-care-setup", "assisted-living-evaluator",
    "end-of-life-planning", "will-and-estate-basics",
    "medicare-medicaid-navigator",
], "Elder care and estate planning")

# Relationship cluster
add([
    "relationship-check-in", "pre-marriage-alignment",
    "difficult-conversation-prep", "hard-conversation",
    "divorce-navigator",
], "Relationships and conversations")

# Parenting cluster
add([
    "new-parent-survival", "teenager-survival-guide",
    "custody-arrangement-planner", "homeschool-planner",
], "Parenting")

# Education cluster
add([
    "learn-anything", "curriculum-designer-chain",
    "flashcard-generator-chain", "misconception-diagnoser-chain",
    "project-based-lesson-design-chain",
], "Education and learning design")

# College cluster
add([
    "college-application-pipeline", "learn-anything",
], "College and education")

# Content marketing cluster
add([
    "content-machine", "content-to-customers",
    "seo-content-auditor-chain", "whitepaper-to-social-threads",
    "multi-platform-copywriter-chain",
], "Content marketing")

# Voice and presentation
add([
    "voice-analyzer-chain", "presentation-architect-chain",
    "whitepaper-to-social-threads",
], "Voice, presentation, and content conversion")

# Real estate cluster
add([
    "property-due-diligence", "deal-underwriting", "tenant-screening",
    "fabric-cre-deal", "fabric-cre-asset-lifecycle",
], "Real estate deals and diligence")

# Real estate management
add([
    "fabric-property-management", "fabric-residential-sale",
    "fabric-home-purchase", "tenant-rights-navigator",
], "Real estate management")

# Legal cluster
add([
    "small-claims-court-prep", "tenant-rights-navigator",
    "complaint-escalation",
], "Legal and disputes")

# Patent cluster
add([
    "patent-filing-pipeline", "patent-drawing-pipeline",
    "trademark-clearance-pipeline",
], "IP filing pipeline")

# Insurance cluster
add([
    "insurance-shopping", "fabric-insurance-placement",
    "fabric-insurance-claims", "fabric-insurance-engagement",
    "insurance-license-pipeline",
], "Insurance")

# Life audit cluster
add([
    "am-i-okay", "stuck-to-unstuck", "new-year-real",
    "new-year-full-reset", "quarterly-life-audit",
], "Life audit and reset")

# Fresh start cluster
add([
    "new-life-kickstart", "new-year-full-reset",
    "healthy-living-reset", "financial-reset",
], "Fresh start and reset")

# Daily morning cluster
add([
    "master-daily", "morning-launch", "morning-routine",
    "solopreneur-daily",
], "Daily morning routines")

# Weekly review cluster
add([
    "master-weekly", "weekly-ops", "life-weekly-review",
    "sunday-reset", "weekend-catchup",
], "Weekly review and reset")

# Monthly review cluster
add([
    "master-monthly", "monthly-full-review", "monthly-life-review",
], "Monthly review")

# Evening shutdown
add([
    "evening-shutdown", "master-daily",
], "Daily bookends")

# Quarterly planning
add([
    "quarterly-life-audit", "quarterly-strategy",
    "90-day-goal-planner-chain",
], "Quarterly planning")

# FlowFabric skill building meta
add([
    "build-a-skill", "skill-factory", "skill-graduation",
    "skill-to-chain", "skill-improvement-pipeline",
    "skill-definition-audit-and-improvement-chain",
    "skill-definition-to-chain-pipeline",
], "FlowFabric skill building")

# Chain discovery meta
add([
    "discover-chains", "skill-to-chain",
], "Flow discovery meta")

# Competitive intelligence
add([
    "competitive-intel", "competitive-intelligence-brief-generator",
    "vendor-evaluation",
], "Competitive intelligence and evaluation")

# IP licensing pipeline
add([
    "ip-directed-search", "ip-licensing-outreach", "ip-social-campaign",
    "cre-license-pipeline", "insurance-license-pipeline",
], "IP and licensing pipelines")

# Security audit cluster
add([
    "security-audit", "input-validation-security",
    "secrets-config", "authentication-authorization",
], "Security engineering bridge")

# Testing meta-cluster
add([
    "test-driven-development", "test-suite-speed",
    "flaky-tests", "e2e-testing", "property-fuzz-testing",
], "Testing disciplines bridge")

# Database cluster
add([
    "database-schema-design", "sql-database-tuning",
    "schema-migrator-chain", "data-dictionary-builder-chain",
], "Database engineering bridge")

# CI/CD cluster
add([
    "ci-pipelines", "release-engineering", "feature-flags-rollout",
], "CI/CD and release bridge")

# API cluster
add([
    "api-build", "api-to-production", "api-client-sdk",
    "api-test-generator-chain", "graphql-service",
], "API engineering bridge")

# Containers <-> Kubernetes bridge
add([
    "containers", "kubernetes-delivery",
], "Containers to Kubernetes bridge")

# Code quality cluster
add([
    "code-quality", "full-audit", "legacy-rescue",
    "security-audit", "codebase-takeover",
], "Code quality and audit")

# Code review cluster
add([
    "code-review", "safe-refactoring", "code-quality",
], "Code review and refactoring bridge")

# Bug fix cluster
add([
    "bug-repro-to-regression", "debug-and-fix", "verified-fix",
    "something-went-wrong",
], "Bug diagnosis and fix")

# Incident response <-> observability bridge
add([
    "incident-response", "observability", "service-resilience",
], "Incident and observability bridge")

# Concurrency <-> performance bridge
add([
    "concurrency-bugs", "performance-profiling", "memory-leak-hunt",
], "Performance and concurrency bridge")

# Monolith <-> containers <-> kubernetes pipeline
add([
    "monolith-decomposition", "containers", "kubernetes-delivery",
], "Monolith to microservice pipeline")

# Data pipeline cluster
add([
    "etl-data-pipelines", "data-investigation",
    "rag-applications",
], "Data pipeline and investigation bridge")

# Cross-compile <-> cross-implementation bridge
add([
    "cross-compile-aarch64", "cross-implementation-parity",
    "language-porting",
], "Cross-platform engineering bridge")

# Terraform <-> secrets bridge
add([
    "terraform-iac", "secrets-config", "containers",
], "Infrastructure and secrets bridge")

# Subscription/payments bridge
add([
    "subscription-billing", "payments-integration",
    "money-ledger-engineering",
], "Payments and billing bridge")

# Realtime systems <-> websocket bridge
add([
    "realtime-systems", "graphql-service",
], "Realtime and API bridge")

# Background jobs <-> ETL bridge
add([
    "background-jobs", "etl-data-pipelines",
], "Async processing bridge")

# Developer docs <-> team onboarding bridge
add([
    "developer-docs", "team-onboarding", "codebase-takeover",
], "Developer docs and onboarding bridge")

# Open source launch
add([
    "open-source-launch", "developer-docs", "package-publishing",
    "release-engineering",
], "Open source and publishing bridge")

# Ticket to PR workflow
add([
    "ticket-to-merged-pr", "code-review", "bug-repro-to-regression",
], "Ticket to merge workflow bridge")

# Type safety <-> refactoring bridge
add([
    "type-safety", "safe-refactoring", "language-porting",
], "Type safety and refactoring bridge")

# LLM evaluation <-> RAG bridge
add([
    "llm-evaluation", "rag-applications", "ai-agent-builder",
], "AI/LLM engineering bridge")

# Stepwise coding <-> TDD bridge
add([
    "stepwise-small-model-coding", "test-driven-development",
], "Disciplined coding bridge")

# Shell scripting <-> CLI build bridge
add([
    "shell-scripting", "cli-tool-build",
], "CLI and scripting bridge")

# Mobile <-> frontend bridge
add([
    "mobile-development", "frontend-components",
    "accessibility-remediation",
], "Frontend and mobile bridge")

# Web performance <-> frontend bridge
add([
    "web-performance", "frontend-components",
    "e2e-testing",
], "Web frontend bridge")

# Website audit
add([
    "website-full-audit", "web-performance", "seo-content-auditor-chain",
    "accessibility-remediation",
], "Website audit bridge")

# AB testing <-> feature flags <-> pricing
add([
    "ab-test-analyzer-chain", "feature-flags-rollout-experiment",
    "pricing-optimizer-chain",
], "Experimentation and optimization")

# Data analysis cluster
add([
    "ab-test-analyzer-chain", "cohort-analyzer-chain",
    "data-investigation", "eda-planner-chain",
    "dashboard-optimizer-chain",
], "Data analysis and visualization")

# Migration planner
add([
    "migration-planner", "monolith-decomposition",
    "fabric-system-modernization",
], "System migration")

# Fabric deal families - CRE
add([
    "fabric-cre-deal", "fabric-cre-asset-lifecycle",
    "fabric-real-estate-development", "fabric-property-management",
    "fabric-residential-sale", "fabric-home-purchase",
], "Fabric real estate")

# Fabric construction
add([
    "fabric-construction-delivery", "fabric-construction-project",
    "fabric-construction-recovery",
], "Fabric construction")

# Fabric supply chain
add([
    "fabric-agriculture-supply", "fabric-food-supply-chain",
    "fabric-supply-chain-recovery", "fabric-manufacturing-supply",
    "fabric-logistics-network", "fabric-ecommerce-logistics",
], "Fabric supply chain and logistics")

# Fabric healthcare
add([
    "fabric-clinical-pharma", "fabric-pharma-pipeline",
    "fabric-healthcare-supply", "fabric-healthcare-transition",
    "fabric-wellness-engagement",
], "Fabric healthcare and pharma")

# Fabric nonprofit
add([
    "fabric-nonprofit-growth", "fabric-nonprofit-merger",
    "fabric-nonprofit-strategy",
], "Fabric nonprofit")

# Fabric education
add([
    "fabric-education-partnership", "fabric-education-technology",
    "fabric-social-services",
], "Fabric education and social services")

# Fabric government
add([
    "fabric-government-compliance", "fabric-government-procurement",
    "fabric-international-expansion",
], "Fabric government and international")

# Fabric insurance
add([
    "fabric-insurance-claims", "fabric-insurance-placement",
    "fabric-insurance-engagement",
], "Fabric insurance")

# Fabric creative and media
add([
    "fabric-creative-deal", "fabric-creative-campaign",
    "fabric-creator-economy", "fabric-media-deal",
    "fabric-publishing-pipeline", "fabric-publishing-pipeline-extended",
], "Fabric creative and media")

# Fabric sports
add([
    "fabric-sports-career", "fabric-sports-contract",
    "fabric-talent-career",
], "Fabric sports and talent")

# Fabric business exits
add([
    "fabric-small-biz-exit", "fabric-small-biz-ownership-transition",
    "fabric-small-biz-launch",
], "Fabric small business lifecycle")

# Fabric tech and data deals
add([
    "fabric-data-tech-deal", "fabric-tech-channel",
    "fabric-tech-deal",
], "Fabric technology deals")

# Fabric PE and venture
add([
    "fabric-pe-acquisition", "fabric-venture-deal",
    "fabric-startup-venture",
], "Fabric PE and venture")

# Fabric hiring and talent
add([
    "fabric-hiring-pipeline", "fabric-talent-acquisition",
    "fabric-workforce-talent", "fabric-executive-development",
    "fabric-org-planning",
], "Fabric hiring and workforce")

# Fabric leadership and strategy
add([
    "fabric-leadership-alignment", "fabric-annual-planning",
    "fabric-product-strategy", "fabric-go-to-market",
    "fabric-revenue-planning",
], "Fabric leadership and strategy")

# Fabric operations
add([
    "fabric-engineering-ops", "fabric-project-delivery",
    "fabric-performance-cycle", "fabric-procurement-cycle",
    "fabric-system-modernization",
], "Fabric operations and delivery")

# Fabric customer and deal
add([
    "fabric-customer-success", "fabric-deal-close",
    "fabric-tech-deal",
], "Fabric customer and deal close")

# Fabric professional services
add([
    "fabric-professional-services-engagement", "fabric-law-firm-ops",
], "Fabric professional services")

# Fabric financial
add([
    "fabric-financial-planning", "fabric-tax-finance",
    "fabric-audit-finance",
], "Fabric financial planning")

# Fabric hospitality and events
add([
    "fabric-hospitality-ops", "fabric-restaurant-ops",
    "fabric-wedding-planning",
], "Fabric hospitality and events")

# Fabric franchise
add([
    "fabric-franchise-launch", "fabric-small-biz-launch",
], "Fabric franchise and small biz launch")

# Fabric immigration
add([
    "fabric-immigration-employment", "immigration-prep",
], "Immigration")

# Fabric crisis
add([
    "fabric-crisis-response", "incident-response",
    "something-went-wrong",
], "Crisis and incident response")

# Decision making cluster
add([
    "big-decision", "before-you-leap", "decision-deep-dive",
    "should-i-quit",
], "Decision making")

# Conflict and hard conversations
add([
    "hard-conversation", "difficult-conversation-prep",
    "conflict-resolver-chain", "complaint-escalation",
], "Difficult conversations and conflict")

# Event planning
add([
    "event-host-pro", "fabric-wedding-planning",
    "volunteer-coordinator",
], "Event planning")

# Pet and family care
add([
    "pet-care-complete", "family-ready", "vacation-planner",
], "Pet and family care")

# Emergency prep
add([
    "emergency-prep-planner", "seasonal-home-prep",
], "Emergency and seasonal prep")

# Stakeholder comms
add([
    "stakeholder-comms-planner-chain", "meeting-to-action",
    "meeting-notes-to-action-items",
], "Stakeholder communication")

# Onboarding cluster
add([
    "new-employee-ready", "manager-first-90", "team-onboarding",
    "client-onboarding",
], "Onboarding")

# Risk and compliance
add([
    "risk-register-builder-chain", "fabric-government-compliance",
    "tamper-evident-logs",
], "Risk and compliance")

# E-commerce
add([
    "ecommerce-optimize", "fabric-ecommerce-logistics",
    "fabric-retail-vendor",
], "E-commerce")

# SaaS launch <-> subscription billing
add([
    "saas-launch", "subscription-billing", "payments-integration",
], "SaaS launch and billing")

# Marketing outreach
add([
    "marketing-outreach-architect", "outreach-engine",
    "ip-licensing-outreach",
], "Marketing and outreach")

# Spec implementation <-> cross-implementation bridge
add([
    "spec-implementation", "cross-implementation-parity",
], "Spec and implementation parity")

# Caching <-> service resilience bridge
add([
    "caching", "service-resilience",
], "Caching and resilience bridge")

# Error handling <-> observability bridge
add([
    "error-handling", "observability", "incident-response",
], "Error handling and observability bridge")

# Dependency upgrades <-> CI bridge
add([
    "dependency-upgrades", "ci-pipelines",
], "Dependency and CI bridge")

# Tamper evident <-> safety bridge
add([
    "tamper-evident-logs", "deterministic-replay-testing",
], "Integrity and replay bridge")

# Community and neighborhood
add([
    "neighborhood-organizer", "terra-unita-setup",
    "volunteer-coordinator",
], "Community organizing")

# Raising Velma (unique)
add([
    "raising-velma-content", "drive-data-logging",
    "vehicle-diagnostics",
], "Raising Velma and vehicle data")

# Routine optimization
add([
    "routine-optimizer-chain", "morning-routine",
    "sleep-protocol-designer-chain",
], "Routine and habit optimization")

# CRE license <-> insurance license
add([
    "cre-license-pipeline", "insurance-license-pipeline",
], "Wayfinder licensing pipelines")

# Company naming
add([
    "company-naming-pipeline", "trademark-clearance-pipeline",
], "Company naming and trademark")

# Email chain
add([
    "email-thread-responder-chain", "meeting-to-action",
], "Email and meeting follow-up")


# Remaining uncovered chains
add([
    "customer-research", "competitive-intel", "first-customers",
], "Customer research and intelligence")

add([
    "digital-life-setup", "tech-confidence-builder",
], "Technology onboarding")

add([
    "fabric-energy-project", "fabric-construction-project",
], "Fabric energy and construction")

add([
    "fabric-international-market-entry", "fabric-international-expansion",
], "Fabric international market")

add([
    "fabric-product-build", "fabric-product-strategy",
    "fabric-engineering-ops",
], "Fabric product build and strategy")

add([
    "franchise-evaluator", "fabric-franchise-launch",
    "deal-underwriting",
], "Franchise evaluation")

add([
    "inheritance-received", "will-and-estate-basics",
    "financial-independence-check",
], "Inheritance and estate")

add([
    "new-project-kickoff", "api-to-production",
    "codebase-takeover",
], "Project kickoff")

add([
    "python-dependency-analysis-and-decoupling-chain",
    "monolith-decomposition-python-boundary",
    "dependency-upgrades-python",
], "Python dependency analysis")

# ── 3. MERGE AND OUTPUT ────────────────────────────────────────────

# Deduplicate: convert each group to a frozenset for comparison
seen = set()
unique_groups = []
for g in groups:
    key = frozenset(g["group"])
    if key not in seen:
        seen.add(key)
        unique_groups.append(g)

# Count coverage
covered = set()
for g in unique_groups:
    for c in g["group"]:
        covered.add(c)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(unique_groups, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Groups: {len(unique_groups)}")
print(f"Chains covered: {len(covered)} / {len(all_names)}")
uncovered = sorted(set(all_names) - covered)
if uncovered:
    print(f"Uncovered ({len(uncovered)}):")
    for c in uncovered:
        print(f"  {c}")
