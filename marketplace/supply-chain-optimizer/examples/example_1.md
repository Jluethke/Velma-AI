# Example: Electronics Manufacturer Supply Chain Audit

## Input
```
suppliers: [
  { "name": "ChipTech Shenzhen", "location": "China", "products": ["MCU-A100", "MCU-B200"], "lead_time_avg": 42, "lead_time_std": 14, "cost": "$2.80/unit", "quality": 97.5, "spend_pct": 35 },
  { "name": "PCB Global", "location": "Taiwan", "products": ["Main PCB"], "lead_time_avg": 21, "lead_time_std": 5, "cost": "$8.50/unit", "quality": 99.2, "spend_pct": 25 },
  { "name": "ConnectorCo", "location": "USA", "products": ["USB-C connector", "Power jack"], "lead_time_avg": 7, "lead_time_std": 2, "cost": "$0.45/unit", "quality": 99.8, "spend_pct": 5 },
  { "name": "CaseMold", "location": "Mexico", "products": ["Plastic housing"], "lead_time_avg": 14, "lead_time_std": 3, "cost": "$3.20/unit", "quality": 98.0, "spend_pct": 15 },
  { "name": "DisplayTech", "location": "South Korea", "products": ["OLED display"], "lead_time_avg": 35, "lead_time_std": 10, "cost": "$12.00/unit", "quality": 99.5, "spend_pct": 20 }
]
products: [{ "name": "SmartWidget Pro", "weekly_demand_avg": 500, "weekly_demand_std": 100, "bom": ["MCU-A100", "Main PCB", "USB-C connector", "Power jack", "Plastic housing", "OLED display"] }]
risk_tolerance: "medium"
```

## Phase 1: MAP Output

**Critical path:** SmartWidget Pro requires ALL 6 components. Any single stockout stops production.

**Concentration analysis:**
- **Geographic:** 35% spend in China, 25% in Taiwan = 60% in East Asia. Regional disruption exposure is high.
- **Spend:** ChipTech Shenzhen at 35% -- single largest supplier dependency.
- **Single source:** EVERY component is single-sourced. No component has an alternate supplier.

**Total lead time (worst case):** 42 days (MCU from China is the longest path).

## Phase 2: ANALYZE Output

**Risk Scorecard:**
| Supplier | Single-Source | Geographic | Financial | Quality | Composite | Rank |
|---|---|---|---|---|---|---|
| ChipTech Shenzhen | 10 | 8 | 5 | 6 | **7.6** | 1 (CRITICAL) |
| DisplayTech | 10 | 4 | 4 | 2 | **5.4** | 3 |
| PCB Global | 10 | 7 | 3 | 2 | **5.8** | 2 |
| CaseMold | 10 | 3 | 5 | 4 | **5.2** | 4 |
| ConnectorCo | 8 | 2 | 3 | 1 | **3.4** | 5 |

**Cost of disruption (ChipTech, 4-week outage):**
- Weekly revenue impact: 500 units x $89 selling price = $44,500/week
- 4-week disruption: **$178,000** in lost revenue
- Plus: contract penalties to retail partners, market share risk

## Phase 3: OPTIMIZE Output

**Safety stock calculations (95% service level, Z = 1.65):**
| Component | Safety Stock (units) | Reorder Point (units) | Weeks of Supply | Inventory Cost |
|---|---|---|---|---|
| MCU-A100 | 1,247 | 4,247 | 8.5 | $3,492 |
| Main PCB | 498 | 1,998 | 4.0 | $4,233 |
| OLED display | 916 | 3,416 | 6.8 | $10,992 |
| Plastic housing | 337 | 1,337 | 2.7 | $1,078 |
| USB-C connector | 180 | 680 | 1.4 | $81 |
| **Total safety stock investment** | | | | **$19,876** |

**Dual-sourcing priority (by risk-adjusted ROI):**
1. **MCU-A100 (highest priority):** Identify alternate chip manufacturer. Insurance premium ~$0.40/unit (15% cost increase on 30% of volume). Annual premium: $3,120. Expected disruption cost: $178,000 x 10% probability = $17,800. **ROI: 5.7x. Dual-source immediately.**
2. **Main PCB:** Taiwan geographic risk + single source. Qualify domestic PCB manufacturer. Premium ~$2.00/unit. Worth it for resilience.
3. **OLED display:** High per-unit cost makes safety stock expensive. Dual-sourcing even at premium may be cheaper than carrying 7 weeks of $12 displays.

## Phase 4: SIMULATE Output

**Scenario: ChipTech Shenzhen offline for 4 weeks**
- Without mitigation: Stockout at day 6 (only ~1 week of MCU inventory). Production halted for 24 days. Revenue loss: **$152,571**
- With proposed safety stock (8.5 weeks): No stockout. Production continues normally. Safety stock reduced to 4.2 weeks by end of disruption. Full recovery within 6 weeks of supplier return.
- With dual-sourcing (70/30 split): Alternate supplier covers 150 units/week. Production reduced to 150/week (30% of normal) but never fully stops. Revenue loss: **$106,800** (vs $152,571 without).
- With BOTH: No production impact at all. Safety stock plus alternate supply covers the full 4-week gap.

**Recommendation:** Implement both safety stock AND dual-sourcing for MCU-A100. Total annual cost: ~$9,000 (safety stock carrying cost + dual-source premium). Protects against $150K+ disruption risk.
