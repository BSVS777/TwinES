## Financial Model

**Run ID:** 2026-11-19-twines-2000
**Date:** 2026-11-19
**Inputs:** `docs/business-briefs/2026-11-19-twines-2000.md`, `01-market-research.md`, `02-competitor-analysis.md`
**Evidence legend:** [B] founder input from the brief; [MR] market research section; [CA] competitor analysis section; [E] modeling assumption (no external source). All dollar amounts are USD.

> **Reading guide.** In this model the "customer" is a **dealer account** (one dealer group or branch that signs a contract). Revenue = paying active vehicles × price per vehicle per month. Vehicle owners do not pay. Figures were computed with a monthly simulation (36 months, three scenarios); the script logic is summarized under Key Assumptions so every number can be reproduced.

---

### Unit Economics (per dealer account, steady state)

| Metric | Pessimistic | Base | Optimistic | Assumption |
|--------|-------------|------|------------|------------|
| Price per active vehicle / month | $1.50 | $2.00 | $2.50 | Founder range $1-$3 [B]; Pitstop lists $2.50/vehicle [CA, vendor claim]. Ceiling of $3 left out of base because a 1,000-vehicle account would pay 3-10x a full shop-management suite ($179-$499/shop/month) [CA] |
| Paying active vehicles per account | 500 | 800 | 1,200 | Branch with ~2,000-5,000 vehicles in a service window, 20-30% activate the app [MR, E] |
| **ARPU (monthly, per account)** | **$750** | **$1,600** | **$3,000** | price × vehicles |
| Variable cost per account / month | $99 | $150 | $225 | $0.10/vehicle (cloud, push, batch AI predictions) + $30/account (technician guided-repair AI usage) + 2.5% payment/bank fees [E] |
| **Gross margin** | **86.8%** | **90.6%** | **92.5%** | (ARPU − variable) / ARPU |
| **CAC (cash, per account)** | **$1,500** | **$1,000** | **$700** | Founder-led direct sales: trips San Carlos ↔ GAM HQs, demos, collateral; excludes founder time [E] |
| Pilot cost (included in model) | 3 months free | 3 months free | 3 months free | Free pilot assumed to close B2B deals; variable costs are paid during the pilot [E] |
| Annual account churn | 25% | 15% | 10% | No local data [MR GAP]; B2B SaaS-style assumption [E] |
| Expected lifetime (capped at 60 months) | 42 months | 60 months | 60 months | 1 / monthly churn, capped [E] |
| **LTV (contribution margin × lifetime)** | **$27,492** | **$87,000** | **$166,500** | |
| **LTV/CAC** | **18.3** | **87.0** | **237.9** | All above the 3.0 threshold, but see the warning below |

**⚠ Warning — LTV/CAC is misleadingly high.** The ratio looks excellent only because (a) CAC counts cash and not the founder's time, (b) the model assumes accounts close after a 3-month pilot, and (c) churn is assumed, not measured. The binding constraint for TwinES is **not unit economics but the number of accounts that can be won**: Costa Rica has ~22 dealer companies for 68 brands [MR], the two largest groups (Purdy, Grupo Q) already built their own apps [CA], so the realistic addressable list is roughly 15-18 groups/branches. If a deal takes 6-12 months of founder time, true CAC including time is several times higher. Treat LTV/CAC as unvalidated.

---

### Cost Structure

Team: **founder only, unpaid** [B, confirmed by the user]. This is the single biggest assumption in the model.

| Category | Monthly Cost | Type | Basis |
|----------|-------------|------|-------|
| Team (founder) | $0 | Fixed | Unpaid founder [B]. Opportunity cost not counted (see sensitivity) |
| Cloud infrastructure (backend, DB, storage/CDN for 3D models) | $80 | Fixed | Small managed hosting tier [E] |
| Tools and subscriptions (Apple dev $99/yr, monitoring, design, email/domain) | $40 | Fixed | [E] |
| Accounting / legal entity upkeep (Costa Rica) | $100 | Fixed | Part-time accountant [E] |
| Sales travel baseline and miscellaneous | $80 | Fixed | San Carlos ↔ GAM trips not tied to a specific deal [E] |
| **Total Fixed** | **$300** | | |
| Variable per active vehicle | $0.10 | Variable | Cloud + batch AI inference + notifications [E] |
| Variable per dealer account | $30 | Variable | LLM usage for guided repair in the workshop panel [E] |
| Payment/bank fees | 2.5% of revenue | Variable | [E] |
| Customer acquisition | $700-$1,500 per new account | Variable (per deal) | See CAC [E] |

**One-time costs (months 1-3): ~$3,000 [E]**

| Item | Estimate | Note |
|------|----------|------|
| Company incorporation (S.A./S.R.L.) and notary | ~$700 | [E] |
| Legal: terms, privacy policy, dealer data-processing agreement (Ley 8968, PRODHAB check) | ~$800 | Legal review flagged as a gap [MR] |
| 3D model library (licensed car models for one dealer's lineup, or generic body types to start) | ~$800 | Per-part segmentation done by the founder [E] |
| Google Play registration, initial branding, demo materials | ~$200 | [E] |
| Contingency | ~$500 | [E] |
| **Total** | **~$3,000** | |

Not included (flagged): OEM repair-content licensing (e.g., ALLDATA Mexico ≈ 5,457 MXN per 3 months [CA]); the model assumes guided repair uses the dealer's own OEM manuals. Telematics/OBD hardware is excluded; predictions rely on mileage, age, service history and manufacturer schedules [MR, CA].

---

### Revenue Forecast (36 months, monthly revenue)

| Month | Pessimistic | Base | Optimistic |
|-------|-------------|------|------------|
| 3 | $0 | $0 | $0 |
| 6 | $0 | $0 | $0 (1st pilot running) |
| 12 | $500 | $1,536 | $5,349 |
| 18 | $650 | $2,953 | $8,467 |
| 24 | $1,260 | $4,259 | $13,382 |
| 36 | $1,595 | $6,572 | $20,611 |

| Annual revenue | Pessimistic | Base | Optimistic |
|----------------|-------------|------|------------|
| Year 1 | $500 | $5,476 | $20,594 |
| Year 2 | $10,129 | $36,645 | $114,224 |
| Year 3 | $17,507 | $66,592 | $205,309 |
| Dealer accounts active at month 36 (churn-adjusted) | ~3.1 | ~5.1 | ~8.0 |
| Paying vehicles at month 36 | ~1,150 | ~3,400 | ~8,400 |

Scenario definitions:
- **Pessimistic:** first pilot starts month 9 (long B2B sales cycle), one new account every 9 months, $1.50/vehicle, 500 vehicles/account, 25% annual churn, CAC $1,500.
- **Base:** first pilot month 6, one new account every 6 months, $2.00/vehicle, 800 vehicles/account, 15% churn, CAC $1,000.
- **Optimistic:** first pilot month 4, one new account every 4 months, $2.50/vehicle, 1,200 vehicles/account, 10% churn, CAC $700.

Sanity check against market size: even the optimistic month-36 base (~8,400 vehicles) is ~2.5% of the estimated SAM of ~337K-385K dealer-sold vehicles [MR]. Year-3 base revenue (~$67K) is ~0.5-1.6% of SAM revenue ($4M-$14M/yr) [MR].

---

### Break-Even Analysis

| Scenario | Accounts Needed (operating) | Accounts Needed if founder takes $1,500/mo | Months to Operating Break-Even | Months to Cumulative Break-Even (recover all losses) |
|----------|-----------------|-----------------|---------------------|---------------------|
| Pessimistic | 1 (0.46) | 3 (2.76) | 12 | 32 |
| Base | 1 (0.21) | 2 (1.24) | 9 | 15 |
| Optimistic | 1 (0.11) | 1 (0.65) | 7 | 10 |

Formula: accounts needed = monthly fixed costs / (ARPU − variable cost per account). Operating break-even = first month in which revenue minus variable and fixed costs is positive (excluding one-time and acquisition spend). Cumulative break-even = first month after launch in which total profit since month 1 is ≥ $0.

Interpretation: with an unpaid founder and $300/month fixed cost, **one paying dealer account covers operating costs in every scenario**. The business only becomes sustainable for the founder (a salary) at 2-3 accounts. The risk is the time to sign the first account, not the cost base.

---

### Key Assumptions
- Founder works unpaid; no hires during 36 months [B].
- Price $1.50-$2.50 per paying active vehicle/month; owners use the app for free [B, CA].
- 500-1,200 paying active vehicles per account, ramping linearly over the first 6 months after a pilot starts [E; vehicle counts per branch are a GAP in MR].
- Every account starts with a 3-month free pilot, then converts (no failed pilots modeled; a failed pilot would delay every scenario by its length plus a new sales cycle) [E].
- Churn applied as expected value (monthly survival probability), not as discrete losses [E].
- No telematics hardware, no OEM data feeds, no paid repair-content licenses; predictions are based on mileage, age, service history and manufacturer schedules [MR, CA].
- Costs in USD with no inflation or exchange-rate (CRC/USD) effects; no taxes modeled (income tax, VAT on digital services must be checked) [E].
- Starting cash = $5,000 (upper end of the "bootstrapped < $5K" budget) [B].
- The first MVP milestone (due 2026-12-05) is treated as development time already spent, at no cash cost.

### Financial Health Indicators
- **Burn rate:** ~$1,300/month in months 1-3 (fixed costs + one-time spend); ~$300/month afterward until the first account pays; peaks at ~$1,300-$1,800 in months when a new pilot starts (CAC).
- **Runway (with $5,000):** ~6-7 months before cash runs out with no revenue. Cash falls below zero around months 5-7 in every scenario, when the first pilot's acquisition cost and free-pilot serving costs land before any revenue.
- **Funding gap:** the model's lowest cash balance is **−$710 (optimistic), −$1,570 (base) and −$2,940 (pessimistic)**. A budget of **~$6,500-$8,000** (or reducing one-time costs, e.g., using generic body-type 3D models and delaying incorporation until a pilot signs) closes the gap in all scenarios.
- **Scale ceiling:** in the base case TwinES is a **small, profitable side business (~$67K revenue in year 3)**, not a venture-scale company. Growth beyond that requires Central America expansion or a second revenue line (e.g., parts commissions, a workshop panel sold per seat) [MR: regional sizing GAP].

### Flags (metrics or inputs below healthy thresholds / unvalidated)
1. **Time to first account** is the decisive variable and has no evidence; every scenario assumes the first dealer signs within 4-9 months.
2. **Willingness to pay per vehicle** is unvalidated; per-vehicle pricing becomes large for big groups relative to shop software and to in-house builds [CA].
3. **CAC excludes founder time**; LTV/CAC above 18 should not be cited as proof of viability.
4. **Churn and activation rates are assumptions** with no Costa Rica data [MR GAP].
5. **Funding gap of $0.7K-$2.9K** against the stated <$5K budget.
6. **No founder salary**: the model is profitable only because labor is free; at $1,500/month for the founder, base needs 2 accounts and is reached around month 12-15.
