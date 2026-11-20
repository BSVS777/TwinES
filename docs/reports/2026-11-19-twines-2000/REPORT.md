---
title: "Business Validation Report: TwinES"
date: 2026-11-19
---

# Business Validation Report: TwinES

**Run ID:** 2026-11-19-twines-2000

## Executive Summary

**The idea.** TwinES is a white-label B2B2C platform for car dealerships in Costa Rica, starting with branches in San Carlos. It gives every vehicle a dealer sells a "digital twin." The customer app shows a rotating, clickable 3D model of the vehicle with each part rated green, yellow, orange or red, predicts the next maintenance with AI and books workshop appointments. The workshop panel offers AI step-by-step guided repairs and a parts catalog that shows the original (OEM) part first and an alternative second. Dealers would pay USD $1-$3 per active vehicle per month. The founder is solo and unpaid, comes from outside the automotive sector, and is bootstrapping with less than $5K. A first MVP milestone, delivered with a full QA cycle, is due 2026-12-05.

**Market opportunity.** Costa Rica's fleet is about 1.9-2.0M registered vehicles, growing about 7% a year. New-car sales have plateaued at about 65-77K a year, so dealers depend more on aftersales revenue. US data shows post-warranty retention often falls to 20-40% and that service and parts generate a large share of dealer gross profit. No Costa Rica retention data exists. Bottom-up estimates put the SAM at about $4M-$14M a year (dealer-sold vehicles from the last ~5 years). The year-1 SOM is about $10K-$30K from one pilot dealer. The market is real but small, and growth beyond it requires expanding into Central America.

**Competitive position.** The founder's assumption that there are no competitors is false. Grupo Purdy (Purdy Go, Purdy Connect) and Grupo Q (Mi Grupo Q, SmartQ) already run owner apps with booking and maintenance history, though both are poorly rated at 1.4-2.9 out of 5. Global vendors such as Connected Cars, myKaarma, Xtime and Keyloop sell dealer-branded aftersales tools, but none showed a Costa Rica presence. No product combines all four TwinES pieces: 3D part-level health, predictive maintenance, AI guided repair and an OEM-first parts catalog. The most realistic first customers are mid-size or multi-brand dealers without an app, such as Veinsa, AutoStar, Cori or Chinese-brand dealers. That they lack an app still needs to be confirmed.

**Financial viability.** The cost base is very lean: about $300 a month in fixed costs, about $3K in one-time costs and an 87-93% gross margin. One paying dealer account covers operating costs in every scenario. Year-3 revenue is about $17.5K in the pessimistic scenario, $67K in the base and $205K in the optimistic. Operating break-even comes at months 12, 9 and 7, and cumulative break-even at months 32, 15 and 10. These results rest on an unpaid founder and on unvalidated price, activation, churn and sales-cycle assumptions. The model also shows a funding gap of $0.7K-$2.9K against the $5K budget. LTV/CAC looks very high but is misleading, because CAC excludes founder time. The real constraint is how many of the ~15-18 viable dealer accounts can be won, and how fast.

**Key risks and recommendation.** The overall risk profile is High: 3 critical risks, 7 high, 4 medium and 2 low. The critical risks are:

1. No dealer may sign within the cash runway.
2. "AI precision" is not credible without vehicle telemetry or OEM data.
3. Scope creep threatens the 2026-12-05 MVP milestone.

The weighted score is **2.45 / 5.0, a NO-GO as a business today.** This is not a rejection of the idea. Demand, pricing and data access are untested, and they must be validated before money or months go into the full build. These checks are cheap: dealer interviews and a letter of intent for a pilot. The MVP milestone should go ahead regardless, with a narrow slice: vehicle registration, rule-based part health and the next-maintenance calculation.

---

## 1. Business Idea Overview

**Name:** TwinES (the "ES" honors D.E.S.N., who inspired the idea)
**Description:** White-label platform for dealerships that creates a digital twin of every vehicle sold. It has a customer app (3D per-part health, AI-predicted maintenance, booking) and a workshop panel (AI guided repair, OEM-first parts catalog) that share one vehicle history.
**Problem:** Dealers lose aftersales customers after the warranty ends. Owners don't know when or what maintenance is due. Technicians lack a unified history and guided procedures.
**Target Audience:** B2B2C. Costa Rican dealer groups and branches pay; vehicle owners and workshop technicians use the product.
**Business Model:** SaaS at USD $1-$3 per active vehicle per month (founder hypothesis).
**Geographic Focus:** Costa Rica, starting in the San Carlos region (purchase decisions are made at GAM headquarters).

---

## 2. Market Research

**Run ID:** 2026-11-19-twines-2000
**Date:** 2026-11-19
**Idea:** TwinES, a white-label B2B2C SaaS for car dealerships in Costa Rica (initial focus San Carlos) that gives each sold vehicle a "digital twin" (customer app + workshop panel). Pricing hypothesis: USD $1-$3 per active vehicle per month.

**Evidence legend:** [V] verified fact read in a fetched source; [S] figure seen in a search snippet or secondary summary only; [E] my estimate/assumption (formula shown); [GAP] data not found. Several sources disagree; conflicts are flagged rather than resolved.

---

### 1. Costa Rica Market Facts

#### 1.1 Vehicle fleet (conflicting sources; scope differs)

| Metric | Value | Status | Source |
|--------|-------|--------|--------|
| Fleet, "more than 3.19 M registered vehicles", end 2025 (+~7.5% y/y) | 3.19 M | [V] reported; scope undefined (likely all categories/registrations) | [Delfino/Detektor, Apr 2026](https://delfino.cr/2026/04/detektor-parque-vehicular-costarricense-supera-los-319-millones-de-vehiculos-y-presiona-los-retos-de-sostenibilidad-del-pais) (cites Registro Nacional + INS) |
| Fleet, INS count, 2025 | 1,879,790 | [V] | [Observador, Jul 2026](https://observador.cr/parque-automotor-en-costa-rica-crecio-mas-del-doble-en-20-anos/) |
| Insured vehicles (SOA) ~1.9 M in 2025; total fleet "about 2 M" | ~1.9-2.0 M | [V] | [CRHoy, Apr 2026](https://crhoy.com/nacionales/presas-y-bajo-costo-impulsan-preferencia-hacia-las-motocicletas/) (cites Sugese) |
| New vehicles entering roads 2025 (all types) | ~174,000 | [V] | same CRHoy article |
| Motorcycles registered 2025 | 87,021 (+29% vs 67,376 in 2024) | [V] | same CRHoy article (cites Aivema) |

Reading: the 3.19 M vs ~1.9-2.0 M gap (about 1.6x) is unexplained. The lower, insurance-based count is the more conservative basis. **No source found for the car/light-vehicle-only count** [GAP]. Both totals include motorcycles, trucks and buses, so they overstate the car base relevant to dealerships.

**Fleet age:** The only figures found are old or of unclear year: ~16 years average for vehicles passing inspection in 2019 ([Observador, Jun 2020](https://observador.cr/vehiculos-revisados-en-costa-rica-tienen-antiguedad-de-16-anos-en-promedio/), [V]); a search snippet attributes ~19 years to inspected cars in a Cosevi report with unknown date [S]. An old fleet means a large share of vehicles is outside dealer warranty windows (supports the "lost aftersales" problem, but also means many vehicles are not dealer-sold).

#### 1.2 New vehicle sales (dealer-channel volume)

| Metric | Value | Status | Source |
|--------|-------|--------|--------|
| New vehicle sales 2024 (Aivema estimate) | ~77,000 | [V] | [La Nacion, Dec 2025](https://www.nacion.com/economia/mas-vehiculos-en-las-calles-este-es-el/S5BH2DGV7NH6NCEM3HWWRV556U/story/) |
| Aivema projection for 2025 | ~72,000 | [V] projection | same |
| New-light-vehicle sales 2025 | 67,507 (-7.3%) | [S] blog citing Aivema; I could not open the post | [Best Selling Cars Blog](https://bestsellingcarsblog.com/tag/new-car-sales-statistics/page/19/) (snippet only) |
| New-light-vehicle sales H1 2026 | 37,022 (-1.6% y/y) | [V] | [Best Selling Cars Blog, Aug 2026](https://bestsellingcarsblog.com/2026/08/costa-rica-h1-2026-chery-46-2-mitsubishi-28-1-among-best-performers/) |
| Customs imports of passenger vehicles 2025 (to 10 Dec) | 91,405 (+3.9%); cargo 20,536 | [V] | La Nacion (above) (cites Aduanas; likely includes used imports, not directly comparable with sales) |
| Top brands by 2025 imports | Toyota 13,784; Nissan 6,554; Hyundai 6,340; Suzuki 6,127; Geely 5,280; BYD 4,409 (+43%); Chery 4,130 | [V] | [El Financiero, Feb 2026](https://www.elfinancierocr.com/negocios/estas-fueron-las-marcas-de-las-cuales-mas-se/N32STZE6K5FK3HTZ6VKZYQQJSI/story/) |

Reading: new-car sales are roughly 65-77K/yr, flat to slightly down after a 2024 peak. Different sources count sales, imports and registrations, so figures are not interchangeable.

#### 1.3 Dealer structure

- 22 dealers/agencies representing 68 brands (cars only, Jan 2024) [V]: [El Financiero, Jan 2024](https://www.elfinancierocr.com/economia-y-politica/quien-es-quien-en-el-mercado-de-las-22-agencias-de/HA5LBOMPTNCDNNVASQCNDNA6AM/story/). Concentrated in groups: Grupo Purdy (Toyota, Lexus, Hino, Ford, VW, Subaru, Xpeng), Grupo Q (Hyundai, Chevrolet, Isuzu, Cadillac), Kauffmann/AutoStar (Mercedes-Benz, Jeep, RAM, Fiat...), Cori Motors (BYD, Chery, JAC...), Veinsa (Mitsubishi, Geely, Peugeot...), Inchcape/Distrito Automotriz (Suzuki, Changan), Ambacar, Cofino, Danissa, plus single-brand importers (Honda, BMW, Porsche, Volvo, etc.). No market-share figures in that article [GAP].
- Brand mix is shifting to Chinese marques (Geely, BYD, Chery in the 2025 top 7 by imports), whose dealers may have a thinner OEM app/aftersales infrastructure (inference [E]).
- **San Carlos presence [S, from search snippets, no address verified]:** Grupo Q lists a San Carlos showroom ([El Financiero list](https://www.elfinancierocr.com/negocios/cuantas-marcas-de-carros-hay-en-costa-rica-cuales/3PHFWFRITBGAZAYWTER436TH6I/story/)); Veinsa has a San Carlos point of sale; Purdy Motor has a San Carlos branch and a 2017 article confirms its mobile workshops serve it ([La Republica, Oct 2017](https://www.larepublica.net/noticia/grupo-purdy-motor-aumenta-flotilla-de-talleres-moviles), [V]; 17 mobile workshops then); Cori Car lists a San Carlos branch. Verification of Ciudad Quesada addresses and workshop capacity: [GAP].
- San Carlos canton: ~198,742 inhabitants (INEC 2022, estimate; census coverage was only 61%; another source says 206,135), 4th most populous canton ([search summary of INEC data](https://telencuestas.com/censos-de-poblacion/costa-rica/2022/alajuela/san-carlos), [S]). **No vehicle count for San Carlos or Alajuela province found** [GAP].
- Implication already flagged in the brief: purchasing decisions sit at group HQ in the GAM; San Carlos is a pilot site, not a buyer.

#### 1.4 Electrification

- ~29,000 EVs (about 16% share, wording ambiguous between fleet and new sales) in Sept 2025, projected ~35,000 by year-end ([Delfino, Sep 2025](https://delfino.cr/2025/09/costa-rica-proyecta-cerrar-este-ano-con-cerca-de-35-mil-vehiculos-electricos), [V]). Another snippet attributes 16% of new vehicles in 2025 being EVs to Asomove [S]; Purdy's CEO cited ~17% of new sales in 2024 and expected ~20% in 2025 ([El Financiero](https://www.elfinancierocr.com/negocios/que-espera-el-ceo-de-grupo-purdy-para-el-2025/GT5OLMET6VCENJZFKZKMZM7R4Q/story), [V]). EV share of new sales is therefore ~16-20%, among the highest in the Americas.
- Relevance: EVs have fewer wear-part service events, a risk to aftersales revenue per vehicle but also a reason dealers want engagement tools; a "part-by-part health" model must support EV components (battery, etc.) (inference [E]).

---

### 2. Market Size (TAM / SAM / SOM)

No published market-size study exists for dealer-side vehicle digital twin / aftersales engagement software in Costa Rica [GAP]. The estimates below are bottom-up from the founder's price hypothesis ($1-$3 per active vehicle per month = $12-$36/vehicle/year) and verified fleet/sales volumes. They are **[E] estimates, not cited market data**.

| Metric | Value | Basis | Status |
|--------|-------|-------|--------|
| TAM (theoretical, nationwide) | ~$23M-$70M/yr | ~1.94 M registered vehicles x $12-$36/yr. Upper bound: includes motorcycles, trucks and non-dealer-serviced vehicles. (Using the 3.19 M figure would give $38M-$115M, not used.) | [E]; fleet from [CRHoy](https://crhoy.com/nacionales/presas-y-bajo-costo-impulsan-preferencia-hacia-las-motocicletas/) |
| SAM (dealer-sold cars in an active service window) | ~$4M-$14M/yr | Assume the platform serves vehicles sold new by dealers in the last ~5 years (assumption: 5 yrs x 67.5-77K sales = ~337K-385K vehicles) x $12-$36/yr. Ignores that some buyers will never install an app. | [E]; sales from La Nacion/Aivema |
| SOM Year 1 (bootstrapped pilot) | ~$5K-$40K/yr (about 500-1,500 paying active vehicles at $1-$3/mo; realistically $10-$30K/yr) | Assume 1 dealer branch/group signs a pilot; branch has ~2,000-5,000 vehicles in service window, 20-30% activate. Pure assumption, no verified conversion data. Pilot could be free or heavily discounted. | [E] |

Sensitivity: because the price ceiling is $3/vehicle/month, even a full capture of dealer-sold vehicles yields only ~$14M/yr nationally. The market is small in revenue terms; viability depends on (a) very low serving cost, (b) the dealer valuing aftersales retention at far more than the fee, or (c) expansion to Central America. Regional expansion sizing: [GAP].

Context benchmarks (global, reference only):
- Global automotive aftermarket: estimates range USD 443B-534B in 2025 and USD 590B-680B by 2030, CAGR ~3.5-6.6% (the 15% CAGR from one vendor looks like an outlier). Sources: [Fortune Business Insights/Grand View/Frost & Sullivan via search summary](https://store.frost.com/growth-opportunities-in-the-automotive-aftermarket-global-2026.html), [360iResearch via GlobeNewswire](https://www.globenewswire.com/news-release/2025/09/11/3148714/28124/en/Trends-Strategies-Shaping-the-476-Billion-Automotive-Aftermarket-2025-2030-Growth-in-Electric-and-Hybrid-Vehicles-is-Prompting-Suppliers-to-Diversify-Product-Portfolios.html) [S].
- Vehicle predictive maintenance: USD 4.66B (2024), 5.48B (2025), forecast 23.39B by 2034, CAGR 17.5%; Latin America ~5% of the market, CAGR ~15.6%, Brazil leading with >3.5 M connected fleet vehicles ([Global Market Insights](https://www.gminsights.com/industry-analysis/predictive-maintenance-for-vehicles-market), [V]; vendor-published). Scope definitions vary widely (sensor-only ~$0.77B up to ~$5B) [S].
- Dealer management system (DMS) software: 2025 estimates vary 7x ($4.85B-$36B) because of differing scopes; no Costa Rica or per-dealer spend data [GAP] ([Diligence Insights, 360iResearch etc. via search](https://www.marketresearch.com/Diligence-Insights-v4290/Dealer-Management-System-Size-Share-40988634), [S]).

---

### 3. Aftersales Economics and Retention (the core ROI premise)

| Finding | Status | Source |
|---|---|---|
| US dealerships wrote >137 M repair orders in 2025; service and parts sales > $81B = 13.3% of total dealership sales | [S] | NADA Data 2025 ([NADA](https://www.nada.org/NADAdata)) via search summary |
| Service and parts about 40-52% of dealership gross profit (sources disagree; none clearly NADA) | [S] | [Dealership Guy](https://news.dealershipguy.com/p/new-car-boom-used-car-squeeze-and-the-future-of-fixed-ops-2025-01-30), Cox Automotive via search |
| Post-warranty retention often falls to ~20-40% once OEM coverage ends | [V] but a secondary citation of CDK Global | [Dealership Guy, Sep 2025](https://news.dealershipguy.com/p/the-hidden-risk-why-post-warranty-service-remains-dealers-biggest-missed-opportunity-2025-09-09) |
| Dealer networks with superior service keep >80% of maintenance/repair dollars; weaker ones <60%; dealers with highest in-warranty satisfaction keep more after warranty (J.D. Power 2009, 106K owners, US) | [V] but 17 years old | [Wards Auto](https://www.wardsauto.com/news/archive-wards-best-dealers-keep-customers-after-warranties-end/773620/) |
| Most post-warranty service goes to non-dealer shops; 79% of aftermarket-shop work is routine maintenance/oil changes; ~70% of luxury vehicles serviced at dealers (J.D. Power 2002, 30K owners) | [V] but 24 years old, US | [F&I Magazine](https://www.fi-magazine.com/news/aftermarket-facilities-capture-majority-of-post-warranty-auto-service-business) |
| European dealer benchmark (559 dealerships, six markets): 74% cannot say how much aftersales revenue they lose; only 6.2% act in the critical year-4 window | [S] vendor (Autoflows) report; PDF unreadable to me | [Autoflows](https://autoflows.com/hubfs/Retention%20Benchmark%20Report_Autoflows.pdf?hsLang=en) |

Gaps: **no Costa Rica or LATAM post-warranty retention data found**; typical warranty length in Costa Rica by brand not verified; a UK source suggests independents retain more, so evidence is not uniform [S]. Most statistics are US/vendor-sourced and dated, so treat the retention premise as a hypothesis to validate with local dealer interviews.

---

### 4. Market Trends

| Trend | Impact | Direction |
|-------|--------|-----------|
| Fleet growth outpacing population (fleet +~7%/yr vs population <1%; ~359 cars added per day per one outlet) | More vehicles needing service; strong congestion reduces owner willingness to visit workshops, favoring booking and mobile service | Growing ([Observador](https://observador.cr/cada-dia-se-suman-359-carros-a-la-flota-vehicular-de-costa-rica/) [S]; 3.19 M source says +7.5%) |
| Motorcycle boom (+29% registrations 2025) | Growth in low-ticket vehicles; outside TwinES's car/OEM scope | Growing |
| New-car sales plateau (~65-77K, flat to -1.6% H1 2026) | New-sale-driven revenue stagnant, so dealers need aftersales/retention | Flat |
| Chinese brand expansion (Geely, BYD, Chery, Changan growing) | Many new brands with immature dealer aftersales; opportunity for white-label tools, but also OEM apps may bundle features | Growing |
| EV adoption ~16-20% of new sales | Fewer wear parts; battery/software health becomes key; model library must cover EVs | Growing |
| Dealers' AI adoption in service is early: Lotlinx (US, Jan 2025): ~5% use AI/predictive data for service predictive maintenance, 78% unsure how to use predictive data; Fullpath: 26% using predictive maintenance; Urban Science: 87% use or intend to use AI for post-sales | Appetite is high but execution is low; vendor surveys with different definitions | Growing ([Lotlinx via VKTR](https://www.vktr.com/the-wire/lotlinx-survey-highlights-significant-challenges-in-ai-and-predictive-data-adoption-among-auto-dealers/), [Digital Dealer](https://digitaldealer.com/news/four-ways-the-automotive-aftersales-market-is-evolving/165727/) [S]) |
| Connected-vehicle data access is hard for dealers (60% of retailers struggle to access/use connected data, one survey) | An independent app without OEM telematics must rely on mileage/date inputs, not live sensor data | Growing constraint [S] |
| Technical inspection (RITEVE) transition in Costa Rica: contract ended; reports of suspended/saturated inspections in 2026 | Disruption of a key periodic vehicle touchpoint and data source; unresolved status | Uncertain ([QCostaRica, Mar/Apr 2026](https://qcostarica.com/riteve-comes-to-an-end-in-costa-rica) [S]) |

### Growth Dynamics
- Costa Rica vehicle fleet CAGR 2005-2025: ~4.7% (751,332 to 1,879,790, derived [E] from [Observador](https://observador.cr/parque-automotor-en-costa-rica-crecio-mas-del-doble-en-20-anos/)); recent annual growth ~7-7.5% depending on source.
- Global aftermarket CAGR: ~3.5-6.6% (2025-2030) [S]. Vehicle predictive maintenance: ~17.5% (2025-2034) [V, vendor]; Latin America ~15.6% [V, vendor].
- Key drivers: aging, growing fleet; dealers' need for post-warranty retention as new-car volume plateaus; EV shift; low-cost cloud/AI tooling.
- Key brakes: small national market (~2 M vehicles); thin per-vehicle pricing; OEM connected-car apps; fragmented, group-HQ-driven purchasing; lack of OEM data access.

### Regulatory Environment
- Personal data: Costa Rica's Ley 8968 (2011) and its regulation govern personal data processing; the agency is PRODHAB. A search found no 2025 reform of the law [S] ([PGR citation of Ley 8968](https://www.pgr.go.cr/wp-content/uploads/2025/12/RG-190924.pdf)). A platform storing owner identity, vehicle plates/VINs and service history will be a data processor/controller and should plan consent, white-label data-ownership terms with dealers, and registration with PRODHAB if applicable (legal check needed [GAP]).
- Vehicle/technical inspection regime is in transition (RITEVE contract expiry, new tender); effects on data and customer flow unclear [S].
- Right-to-repair/OEM parts rules, warranty implications of non-OEM parts recommendations and VIN-based OEM data licensing in Costa Rica were not researched in depth [GAP].

### Technology Trends
- Predictive maintenance is moving from fleet telematics to light vehicles; without OEM telematics access, TwinES predictions would rely on mileage, age, service records and model-level wear schedules (inference [E]).
- 3D/digital-twin customer experiences exist in OEM apps; third-party white-label equivalents for Latin American dealers were not found in this research (see competitor analysis).
- Generative AI guided-repair tools are emerging for technicians; BCG published a March 2026 deck on AI in the commercial vehicle aftermarket ([BCG](https://web-assets.bcg.com/c8/3e/9ac1ec3c40df83c1634411a99e90/ai-in-the-commercial-vehicle-aftermarket-slideshow-mar-2026.pdf), not read [GAP]). OEM repair-information licensing is a likely blocker for AI guided repairs (inference [E]).
- Latin American connected-car data is in market-size terms only: Brazil telematics ~USD 224M (2025), Mexico connected car ~USD 1.63B (2025), mostly fleet/aftermarket telematics ([search summaries](https://www.marketsandmarkets.com/Market-Reports/geography/automotive-telematics-market/Brazil), [S]); no Costa Rica or penetration data [GAP].

---

### Key Evidence Gaps (for downstream skills)
1. Car-only fleet count and fleet age by brand/warranty status; vehicle counts for San Carlos/Alajuela.
2. Costa Rica/LATAM post-warranty retention rates and dealer aftersales revenue (all retention data is US/EU and dated).
3. Dealer-group market shares and any dealer digital-spend or willingness-to-pay data; OEM apps already offered in Costa Rica (Toyota, Hyundai, BYD).
4. Final official 2025 Aivema sales total (67.5K is from a blog; 72K was a projection).
5. Legal advice on Ley 8968 obligations and VIN/OEM data licensing.
6. Primary research recommended: interviews with 3-5 service managers (San Carlos branches and GAM HQs) to validate retention loss and price tolerance.

### Sources
- [Delfino/Detektor: fleet 3.19 M (Apr 2026)](https://delfino.cr/2026/04/detektor-parque-vehicular-costarricense-supera-los-319-millones-de-vehiculos-y-presiona-los-retos-de-sostenibilidad-del-pais)
- [Observador: fleet 1.88 M, 2005-2025 (Jul 2026)](https://observador.cr/parque-automotor-en-costa-rica-crecio-mas-del-doble-en-20-anos/)
- [CRHoy: motorcycles, ~2 M fleet (Apr 2026)](https://crhoy.com/nacionales/presas-y-bajo-costo-impulsan-preferencia-hacia-las-motocicletas/)
- [La Nacion: 2025 imports, Aivema 2024-25 sales](https://www.nacion.com/economia/mas-vehiculos-en-las-calles-este-es-el/S5BH2DGV7NH6NCEM3HWWRV556U/story/)
- [El Financiero: 2025 brand import ranking (Feb 2026)](https://www.elfinancierocr.com/negocios/estas-fueron-las-marcas-de-las-cuales-mas-se/N32STZE6K5FK3HTZ6VKZYQQJSI/story/)
- [El Financiero: who's who among 22 dealers (Jan 2024)](https://www.elfinancierocr.com/economia-y-politica/quien-es-quien-en-el-mercado-de-las-22-agencias-de/HA5LBOMPTNCDNNVASQCNDNA6AM/story/)
- [El Financiero: Grupo Purdy CEO outlook 2025](https://www.elfinancierocr.com/negocios/que-espera-el-ceo-de-grupo-purdy-para-el-2025/GT5OLMET6VCENJZFKZKMZM7R4Q/story)
- [Best Selling Cars Blog: H1 2026](https://bestsellingcarsblog.com/2026/08/costa-rica-h1-2026-chery-46-2-mitsubishi-28-1-among-best-performers/)
- [La Republica: Purdy mobile workshops (2017)](https://www.larepublica.net/noticia/grupo-purdy-motor-aumenta-flotilla-de-talleres-moviles)
- [Observador: RITEVE inspected fleet age (2020)](https://observador.cr/vehiculos-revisados-en-costa-rica-tienen-antiguedad-de-16-anos-en-promedio/)
- [Delfino: EV fleet (Sep 2025)](https://delfino.cr/2025/09/costa-rica-proyecta-cerrar-este-ano-con-cerca-de-35-mil-vehiculos-electricos)
- [Global Market Insights: vehicle predictive maintenance](https://www.gminsights.com/industry-analysis/predictive-maintenance-for-vehicles-market)
- [Frost & Sullivan: automotive aftermarket 2026](https://store.frost.com/growth-opportunities-in-the-automotive-aftermarket-global-2026.html)
- [GlobeNewswire/360iResearch: aftermarket 2025-2030](https://www.globenewswire.com/news-release/2025/09/11/3148714/28124/en/Trends-Strategies-Shaping-the-476-Billion-Automotive-Aftermarket-2025-2030-Growth-in-Electric-and-Hybrid-Vehicles-is-Prompting-Suppliers-to-Diversify-Product-Portfolios.html)
- [Wards Auto: J.D. Power 2009 retention](https://www.wardsauto.com/news/archive-wards-best-dealers-keep-customers-after-warranties-end/773620/)
- [F&I Magazine: J.D. Power 2002](https://www.fi-magazine.com/news/aftermarket-facilities-capture-majority-of-post-warranty-auto-service-business)
- [Dealership Guy: post-warranty retention (Sep 2025)](https://news.dealershipguy.com/p/the-hidden-risk-why-post-warranty-service-remains-dealers-biggest-missed-opportunity-2025-09-09)
- [NADA Data](https://www.nada.org/NADAdata)
- [Lotlinx survey via VKTR](https://www.vktr.com/the-wire/lotlinx-survey-highlights-significant-challenges-in-ai-and-predictive-data-adoption-among-auto-dealers/)
- [Digital Dealer: aftersales evolving](https://digitaldealer.com/news/four-ways-the-automotive-aftersales-market-is-evolving/165727/)
- [Autoflows Retention Benchmark](https://autoflows.com/hubfs/Retention%20Benchmark%20Report_Autoflows.pdf?hsLang=en)
- [Diligence Insights: DMS market](https://www.marketresearch.com/Diligence-Insights-v4290/Dealer-Management-System-Size-Share-40988634)
- [MarketsandMarkets: Brazil telematics](https://www.marketsandmarkets.com/Market-Reports/geography/automotive-telematics-market/Brazil)
- [QCostaRica: RITEVE end](https://qcostarica.com/riteve-comes-to-an-end-in-costa-rica)
- [Telencuestas: San Carlos population (INEC-based)](https://telencuestas.com/censos-de-poblacion/costa-rica/2022/alajuela/san-carlos)
- [PGR: Ley 8968 reference](https://www.pgr.go.cr/wp-content/uploads/2025/12/RG-190924.pdf)

---

## 3. Competitive Landscape

**Run ID:** 2026-11-19-twines-2000
**Research date:** 2026-11-19
**Method:** Web search plus direct page fetches (vendor pages, App Store listings, Costa Rican business press). Labels used throughout: **[V]** verified on a primary or named source, **[T]** third-party or vendor-marketing claim, **[E]** estimate/inference, **[GAP]** could not be verified.

**Headline finding:** The founder's "no competitors" premise does not hold. Costa Rican dealer groups already ship owner apps (Purdy Go, Mi Grupo Q) that cover appointment booking and maintenance history, and global vendors sell dealer-branded predictive-maintenance apps. However, **no source found combines the full TwinES bundle** (3D per-part health view + predictive maintenance + AI guided repair + OEM-first parts catalog, white-label, priced per vehicle for LATAM dealers). The white space is the combination and the locally delivered, low-price white-label offer, not any single feature.

---

### Direct Competitors

Direct = same problem (dealer aftersales retention / owner-facing vehicle care) and same buyer (the dealer), either in Costa Rica today or as a white-label vendor that could enter.

| Competitor | Product | Pricing | Target Market | Strengths | Weaknesses |
|------------|---------|---------|---------------|-----------|------------|
| **Mi Grupo Q** (Grupo Q Corporativo; in-market) | Self-service owner app for Hyundai, Chevrolet, Isuzu owners: workshop appointments, maintenance history, partner perks, emergency button, in-app payment of workshop orders and credit installments; "SmartQ" telematics add-on (tracking, alerts, remote engine/door lock) **[V: DPL News 2022; App Store]** | Free to owner; dealer cost not applicable (in-house) | Grupo Q's own customers (one of the dealer groups TwinES targets) | Already integrated with the group's workshop/payment systems; telematics add-on; incumbent with customer base | Weak ratings (2.5/5 from 16 ratings on US store; 1.4/5 from 11 on Nicaragua store), login/password-reset complaints **[V: App Store, small samples]**. No 3D view, no part-level health, no AI repair guidance found **[V by absence in listings; not exhaustive]** |
| **Purdy Go / Purdy Connect** (Grupo Purdy; in-market) | Official Grupo Purdy app: view vehicles and maintenance history, book workshop appointments, view maintenance plans and credits, partner discounts, vehicle shopping/reservation. Purdy Connect is a separate remote-monitoring system (door lock, immobilize, GPS, battery/fuel data), announced June 2024 **[V: App Store; La Republica Apr 2026; Observador Jun 2024]** | Free to owner; Purdy Connect price not published **[GAP]** | Grupo Purdy customers (Toyota-related per 2021 coverage; full brand list not verified) | Strong brand, large parts warehouse and mobile workshops, active app development (v1.17) | 2.9/5 from 12 ratings; users report vehicle-registration problems and slow support **[V: App Store, small sample]**. No 3D/part-level health or guided repair found |
| **Connected Cars** (connectedcars.io; HQ and market coverage not verified) | Dealer aftersales software: **fully dealer-branded owner app**, predictive maintenance scheduling, push campaigns, customer profiling, car health certificate; data via OEM API or retrofit telematics device (CC-Link); integrates with DMS (Keyloop, Annata, Salesforce) **[T: vendor page; patent/market search]** | Not published **[GAP]** | Franchised dealers, multi-brand | Closest functional match to TwinES's white-label + predictive maintenance pitch; works without OEM cooperation via retrofit hardware | Needs OBD/telematics hardware or OEM API (cost, installation, privacy); LATAM presence not stated **[GAP]**; no evidence of 3D part-level model or guided repair |
| **Dealer aftersales engagement platforms: myKaarma, Dealer-FX, Xtime (Cox Automotive), CDK Global, Keyloop Service Hub** | Service scheduling, check-in, video inspections, text/payments, retention marketing; Keyloop Service Hub covers customer-facing aftersales; Xtime launched an enhanced consumer scheduler on 2026-11-09 **[V: vendor/press pages]** | Quote-only; none publish prices **[V: G2/Capterra/FitGap show no public price]** | Mainly US/Canada/UK dealers; Dealer-FX sold largely via OEM programs in US/Canada/Puerto Rico **[T]** | Deep DMS integration, mature, claimed lifts (e.g., Dealer-FX "20% lift in dollars per RO" is a **vendor claim**) | Built for US/EU franchise workflows, English-first, enterprise pricing and sales cycles; no evidence of Costa Rica presence or 3D digital-twin UX **[GAP on LATAM]** |
| **Piston Labs / Pitstop** (OBD predictive maintenance) | Piston Labs: OBD-II device + shop dashboard for retention + consumer app **[T: its own pitch docs]**. Pitstop (now "A Fullbay Company"): AI predictive maintenance, fault-code management, parts and work orders, focused on fleets **[V: pitstopconnect.com]** | **Pitstop lists $2.50 per vehicle (billing period not stated on the page; it compares to a claimed $4.50 market average) [T]** | Fleets (Pitstop); dealers/shops (Piston Labs) | Closest published per-vehicle price point to TwinES's $1-$3 hypothesis; claims 95.5% prediction accuracy (**unverified marketing claim**) | Fleet-oriented, not retail owners; hardware/OBD dependence; Piston Labs figures are self-reported and traction is unproven |

### Indirect Competitors

| Competitor | Product | How They Compete | Overlap |
|------------|---------|------------------|---------|
| **OEM connected-car apps: Toyota LATAM app / Toyota Connected Services, Hyundai Bluelink, Kia Connect** | Toyota LATAM app (seller Toyota Argentina S.A.): maintenance reminders and service history, but the listing says online scheduling is "available in Argentina and Venezuela" and service history in "Argentina only"; Costa Rica is **not** named in feature availability **[V: App Store]**. Toyota Connected Services launched in Argentina (Nov 2024) and Colombia (Aug 2025) **[V: press]**. Bluelink: 2021 announcement said Brazil and Central America were planned; I found **no** confirmation it operates in Costa Rica **[GAP]**. Kia Connect: no evidence of availability in Costa Rica; regional pages list other markets **[GAP/E]** | OEMs own the vehicle data and could disintermediate a third-party app if/when they launch locally; they also set dealer data-access rules | **Medium** now (not confirmed in CR), **High** risk later |
| **Workshop management software: Tekmetric, AutoLeap, Shopmonkey; LATAM: OK CAR (listed as available in Costa Rica)** | Shop operations, digital vehicle inspections, estimates, invoicing, customer texting, maintenance schedules (Tekmetric Grow tier). Tekmetric plans: Start $199, Grow $349, Scale $439 per month (annual: $179/$309/$409), unlimited users **[V: tekmetric.com/pricing]**. Shopmonkey: Basic $239, Clever $399, Genius $499 per month ($215/$359/$449 billed annually) **[V: Shopmonkey blog, vendor-authored, checked 2026-08-12]**. AutoLeap about $179-$449 per month **[T: third-party]**. OK CAR: from 699 MXN (unit and period unclear) **[T: Capterra listing]** | Own the technician/workshop side and the vehicle service record; could add owner apps. Aimed at independent shops, which are the dealers' retention threat | **Medium** (workshop panel side) |
| **Repair information / guided repair: ALLDATA, Mitchell 1, Haynes, Bosch/Autodata** | OEM repair procedures and diagnostics subscriptions. ALLDATA has a Mexico site with 3- and 6-month prepaid plans (5,457 and 10,494 MXN excl. VAT) **[V: alldata.com/mx]**; US single-shop prices are around $189-$199/month **[T: third-party, partly dated]** | Provide the repair content that TwinES's "AI guided repair" would need. Strong content licensing barrier; TwinES would likely license or rely on dealer/OEM manuals rather than compete | **Medium** (AI guided repair feature) |
| **Consumer trackers: CARFAX Car Care, Drivvo, Fuelio** | CARFAX Car Care: free; reminders, service history (auto-logged at partner shops), recall alerts, shop search **[V: App Store/CARFAX]**. Drivvo: freemium, reminders by km/date; paid plan prices conflicting (examples: $11.99/yr old review vs $49/yr offers cited by a reviewer) **[T, conflicting]**. Fuelio not researched in detail **[GAP]** | Owners can already track maintenance free, which caps willingness to pay by the owner and keeps the buyer as the dealer | **Medium-Low** |
| **Quinpart** (Costa Rica, launched late 2025) | Parts marketplace: owner or mechanic enters a license plate, platform matches parts across wholesalers/retailers; suppliers pay $15/month (50 items) up to custom plans around $650/month (25,000 items) **[V: El Financiero, 2026-08-28]** | Local competitor/partner for the OEM-first parts catalog; shows a Costa Rican team already working on parts discovery. Fills the independent-parts side of the "OEM plus alternative" idea | **Medium** (parts catalog feature) |
| **Brand-specific dealer apps: Nissan/Audi (Grupo Danissa)** | 2020 apps with 360-degree views, model info, appointment scheduling (Nissan) **[V: La Republica, 2020-03-20; stale]**. Current status unknown **[GAP]** | Shows precedent for dealer-built consumer apps in CR and for "360 view" UX, but for sales rather than health status | **Low-Medium** |
| **Veinsa Motors, AutoStar** | No customer app or booking portal found for either **[GAP]** (Veinsa site fetch inconclusive; AutoStar's San Carlos branch had aftersales "coming soon" as of May 2025 **[V: Delfino, 2025-05]**) | Not competitors but **warm prospects**: apparent absence of an owner app, to be confirmed by direct inquiry | n/a (prospects) |
| **Experimental 3D/twin projects (AutoX3, TruFix, patents)** | AutoX3 app listing mentions 3D vehicle models and standardized health checks; TruFix is a student-style OBD "3D digital twin" for mechanics; several patents describe digital-twin maintenance scheduling **[T: listings/patents]** | Evidence that the concept is not novel, but no shipping product found that combines it with dealer white-label | **Low** (today) |

### Pricing Benchmarks

| Benchmark | Price | Unit | Confidence |
|-----------|-------|------|------------|
| Pitstop (fleet predictive maintenance) | $2.50 | per vehicle (period not stated) | [T] vendor homepage |
| TwinES hypothesis | $1-$3 | per active vehicle per month | founder estimate, unvalidated |
| Tekmetric | $179-$439 | per shop per month | [V] vendor page |
| Shopmonkey | $215-$499 | per shop per month | [V] vendor-authored blog |
| AutoLeap | about $179-$449 | per shop per month | [T] |
| ALLDATA Repair (US) | about $189-$199 | per month | [T], partly dated |
| Quinpart (CR) | $15-$650 | per supplier per month | [V] press |
| myKaarma, Dealer-FX, Xtime, CDK, Keyloop, Connected Cars | not published | quote-only | [V] absence of public price |
| Mi Grupo Q, Purdy Go | free to owner | n/a (funded by dealer) | [V] |

**Illustrative arithmetic [E]:** a San Carlos branch with 1,000 active vehicles at $1-$3 would be about $1,000-$3,000 per month ($12,000-$36,000 per year), which is roughly 3-10 times what a Costa Rican workshop pays for a full shop-management suite (Tekmetric-class $179-$439/month). Per-vehicle pricing scales with parc size, so large dealer groups face a large annual figure compared to what they pay for generic tools, and may compare it to the cost of building in-house (as Grupo Q and Purdy already did). The vehicle counts here are assumptions, not data.

### Competitive Positioning Map

Ratings are my qualitative estimates (1 low to 5 high) based only on the evidence above, not measured scores.

| Feature / Dimension | TwinES (planned) | Mi Grupo Q | Purdy Go/Connect | Connected Cars | Tekmetric-class shop SaaS | CARFAX Car Care / Drivvo |
|---------------------|------------------|-----------|------------------|----------------|--------------------------|--------------------------|
| Price point | $1-$3/vehicle/mo (hyp.) | Free to owner; in-house cost | Free to owner; in-house cost | Quote-only | $179-$499/shop/mo | Free / freemium |
| Buyer | Dealer (white-label) | Self (Grupo Q) | Self (Grupo Purdy) | Dealer | Workshop | Consumer |
| White-label for any dealer | Yes | No | No | Yes | No | No |
| Owner app with maintenance history | Yes | Yes | Yes | Yes | Limited | Yes |
| Appointment booking | Yes | Yes | Yes | Yes | Partial | No |
| Per-part 3D health view (green to red) | Yes (core) | Not found | Not found | Not found | No | No |
| Predictive maintenance | Yes (AI) | Not found | Not found | Yes (T) | Schedules only | Reminders only |
| AI guided repair for technicians | Yes | No | No | No | No (separate content vendors) | No |
| OEM-first parts catalog | Yes | Not found | Not found | No | Inventory/vendor mgmt | No |
| Needs hardware (OBD/telematics) | No (planned) | SmartQ add-on | Purdy Connect | Often (retrofit) | No | No |
| Costa Rica local presence | Founder-local | Yes | Yes | Unknown | Unknown | No |
| Feature richness (E) | 5 (planned, unbuilt) | 3 | 3 | 3-4 | 4 (workshop side) | 2 |

### Market Gaps and Opportunities

1. **Mid-size and multi-brand dealers without an in-house app.** Grupo Q and Purdy built their own apps. No owner app was found for Veinsa or AutoStar **[GAP, to confirm]**, and smaller regional dealers likely lack the budget to build. A low-cost white-label option is a plausible wedge, but this is an inference **[E]**.
2. **Quality gap in incumbents.** The two local apps have low ratings (1.4-2.9/5, small samples) with registration and login problems. A polished UX is a differentiator, though sample sizes are small **[V/E]**.
3. **No found product bundles 3D part-level health, predictive maintenance, guided repair and parts in one dealer-branded system.** Each piece exists separately (Connected Cars for branded predictive apps, ALLDATA for repair content, Quinpart for parts, Tekmetric for shop workflow). The bundle is the white space, but it is also a large build for a bootstrapped founder **[E]**.
4. **Spanish-first, Costa Rica-first offering.** Global dealer platforms (myKaarma, Dealer-FX, Xtime, CDK, Keyloop) are built around US/EU markets; no evidence of local Costa Rican deployment found **[GAP]**.
5. **Independent workshop leakage after warranty.** The brief's core problem. I could not find a market-share figure for independents versus dealerships in Costa Rica **[GAP]**; one source (Consumer Reports via Costa Rica press) rates independents highly for honesty and quality, which supports the existence of the leakage problem but also shows the dealer's value proposition has to be strong **[T]**.

### Key Takeaways

- **"No competitors" is false; reframe as "competitors exist in pieces."** The most direct threats are the dealer groups' own apps (they already own the customer relationship and workshop data) and white-label vendors like Connected Cars. The pitch must explain why a dealer should buy rather than extend its existing app.
- **Biggest structural risk is OEM and dealer-group in-housing.** Large target groups (Purdy, Grupo Q) already invest in apps and telematics (Purdy Connect, SmartQ). Toyota's regional app and Connected Services are expanding country by country; Costa Rica is not confirmed yet. A realistic early customer is a smaller or multi-brand dealer, not the groups that already built apps.
- **Pricing hypothesis is coherent with the one published per-vehicle benchmark (Pitstop $2.50) but high relative to local shop software.** Unit economics depend on active-vehicle counts that are unknown; validate with dealer interviews and ask what Grupo Q and Purdy spent building their apps.
- **Data access is the unresolved dependency.** Predictive maintenance and "exact part health" require mileage, service history and OEM maintenance schedules. Without telematics or OEM APIs, health will be estimated from service history and schedules. Competitors who solve this use retrofit hardware (Connected Cars, Piston Labs) or OEM data, both outside a bootstrapped budget **[E]**.
- **For the first MVP milestone (due 2026-12-05):** the competitor evidence supports scoping to vehicle registration, part-health view and next-maintenance calculation based on service schedules, which is where the incumbents are thinnest.

### Evidence Gaps (to close before relying on this section)

- Whether Hyundai Bluelink or Kia Connect operate in Costa Rica (no evidence found; not proven absent).
- Whether Toyota Costa Rica (Purdy) offers Toyota Connected Services locally.
- Veinsa and AutoStar owner app/booking portals (not found; Veinsa site fetch returned no useful content).
- Pricing of Connected Cars, myKaarma, Dealer-FX, Xtime, CDK, Keyloop, Purdy Connect, SmartQ (not published).
- Costa Rican workshop-software incumbents and prices (only OK CAR surfaced, via a third-party listing).
- Independent versus dealer aftersales market share in Costa Rica.
- Fuelio, Mitchell 1, Haynes, Autodata/Bosch, Autorola not researched in depth; excluded from tables as lower relevance (Autorola is remarketing-focused, not aftersales).
- App Store rating samples are small (11-16 ratings) and country storefronts differ.

### Sources

- Mi Grupo Q, App Store: https://apps.apple.com/us/app/id972874159
- Mi Grupo Q / SmartQ description (DPL News, citing El Financiero, 2022-03-17): https://dplnews.com/?p=144239
- Purdy GO, App Store: https://apps.apple.com/us/app/id1536614177
- Purdy Go at Expomovil 2026 (La Republica, 2026-04-17): https://www.larepublica.net/noticia/grupo-purdy-transforma-la-experiencia-de-expomovil-2026-con-una-propuesta-digital-para-reservar-vehiculos-de-forma-simple-y-segura/
- Purdy Connect (Observador, 2024-06-12): https://observador.cr/video-grupo-purdy-introduce-sistema-para-vigilar-apagar-encender-y-controlar-el-carro-desde-el-celular/
- Grupo Purdy lessons / Purdy Go origin (Revista EyN): https://www.revistaeyn.com/empresasymanagement/grupo-purdy-que-lecciones-aprendio-a-un-ano-del-covid-19-GBEN1452040
- Toyota LATAM app, App Store: https://apps.apple.com/us/app/toyota-latam/id1597365457
- Toyota Connected Services Colombia (Autocosmos, 2025-08-20): https://noticias.autocosmos.com.co/2025/08/20/automotores-toyota-colombia-ahora-ofrece-servicios-de-seguridad-diagnostico-y-conectividad
- Hyundai Bluelink LATAM launch context (MobileTime, 2021): https://www.mobiletime.com.br/noticias/26/04/2021/hyundai-lanca-seu-servico-de-conectividade-veicular-bluelink/
- Hyundai Costa Rica IONIQ 5 post (no Bluelink mention): https://www.hyundaicr.com/blog/wp-json/wp/v2/posts/1501
- Kia Connect MEA regional page: https://connect.kia.com/mea/en/kia-connect-plan/
- Nissan/Audi Costa Rica apps (La Republica, 2020-03-20): https://www.larepublica.net/noticia/nissan-y-audi-ofrecen-app-en-costa-rica-con-showroom-virtual-y-vistas-3600
- AutoStar San Carlos branch (Delfino, 2025-05): https://delfino.cr/2025/05/autostar-mejora-su-atencion-en-la-zona-norte-con-instalaciones-renovadas-y-nuevos-servicios
- Veinsa Motors: https://veinsamotors.com
- Connected Cars (dealer solution): https://connectedcars.io/solution-dealers/
- Pitstop: https://www.pitstopconnect.com
- Piston Labs one-pager: https://piston-docs.pages.dev/docs/one-pager.html
- Tekmetric pricing: https://www.tekmetric.com/pricing
- Shopmonkey pricing (vendor blog): https://www.shopmonkey.io/blog/best-auto-repair-shop-management-software-2026-top-picks-compared
- AutoLeap pricing (third-party): https://www.capterra.com/p/216500/Autoleap/pricing/
- ALLDATA Mexico plans: https://www.alldata.com/mx/en/contract-free-plans
- ALLDATA pricing (third-party): https://www.thepricer.org/alldata-subscription-cost/
- CARFAX Car Care, App Store: https://apps.apple.com/us/app/-/id552472249
- Drivvo pricing (Capterra): https://www.capterra.com/p/219368/Drivvo/
- myKaarma pricing (FitGap): https://us.fitgap.com/products/021440/mykaarma
- Dealer-FX pricing (G2): https://www.g2.com/products/dealer-fx/pricing
- Xtime scheduler launch (Cox Automotive, 2026-11): https://www.coxautoinc.com/press-releases/cox-automotive-launches-an-enhanced-xtime-consumer-scheduler-with-a-streamlined-mobile-first-service-booking-experience/
- CDK ServiceView (BusinessWire): https://www.businesswire.com/news/home/20210823005066/en
- Keyloop Service Hub (S&P Global): https://aftermarketinsight.spglobal.com/news/4404/uks-keyloop-launches-service-hub-to-manage-aftersales-journey-for-dealers-and-customers
- Quinpart (El Financiero, 2026-08-28): https://www.elfinancierocr.com/tecnologia/busca-repuestos-para-su-vehiculo-startup-tica/CGT6J3GNIRECNK5HK6IZTHPA2I/story/
- OK CAR and workshop software listings (Capterra Spain): https://www.capterra.es/software/1110636/OK-CAR
- Digital twin patents (3D vehicle model for service): https://patents.justia.com/patent/10909779
- Costa Rica independents vs dealerships context (Teletica / El Financiero results): https://www.teletica.com/amp/nacional/sabe-usted-de-cuanto-es-la-garantia-en-la-compra-de-un-vehiculo_403906

---

## 4. Financial Model

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

---

## 5. SWOT Analysis

**Run ID:** 2026-11-19-twines-2000
**Date:** 2026-11-19
**Inputs synthesized:** business brief, `01-market-research.md` [MR], `02-competitor-analysis.md` [CA], `03-financial-model.md` [FM]. This section does no new research; every point traces to one of those files.

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | **Strengths** | **Weaknesses** |
| | - S1. Unique bundle: no product found combines 3D per-part health, predictive maintenance, AI guided repair and an OEM-first parts catalog, white-labeled for dealers [CA] | - W1. Solo, unpaid founder with no automotive industry background or dealer network [B, FM] |
| | - S2. Very lean cost base (~$300/month fixed); one paying dealer account covers operating costs in every scenario [FM] | - W2. Bootstrapped budget (<$5K) leaves a $0.7K-$2.9K funding gap in all scenarios [FM] |
| | - S3. High gross margin (87-93%) because no hardware is required [FM] | - W3. Very large planned scope (two apps, 3D library, AI, parts catalog) for one person [CA] |
| | - S4. Local presence (San Carlos), Spanish-first, can iterate on site with branches [B, CA] | - W4. No access to vehicle telemetry or OEM data; "AI precision" rests on mileage, age and service history only [MR, CA] |
| | - S5. Visual, demo-friendly differentiator (rotating 3D vehicle with traffic-light part status) in a market where incumbent apps are rated 1.4-2.9/5 [CA] | - W5. Key numbers (activation, churn, willingness to pay, sales cycle) are assumptions with no local evidence [MR, FM] |
| **External** | **Opportunities** | **Threats** |
| | - O1. New-car sales flat to down (~65-77K/yr), pushing dealers toward aftersales revenue and retention [MR] | - T1. Largest groups already built in-house apps and telematics (Purdy Go/Connect, Mi Grupo Q/SmartQ) [CA] |
| | - O2. Post-warranty retention commonly drops to ~20-40% (US data), and service/parts are a large share of dealer gross profit [MR] | - T2. OEM connected-car apps (Toyota, Hyundai, Kia) are expanding country by country and control vehicle data [CA] |
| | - O3. Fast-growing Chinese brands (Geely, BYD, Chery, Changan) whose dealers may lack mature aftersales tooling [MR] | - T3. Small national market: full capture of dealer-sold cars caps near ~$14M/yr; only ~15-18 realistic dealer accounts [MR, FM] |
| | - O4. Mid-size/multi-brand dealers with no owner app found (Veinsa, AutoStar; to confirm) [CA] | - T4. Global white-label vendors (Connected Cars, myKaarma, Xtime, Keyloop) could enter LATAM [CA] |
| | - O5. Low dealer AI adoption in service (~5% use predictive data, US survey) with high stated intent [MR] | - T5. Legal exposure: Ley 8968 personal data duties, OEM repair-content licensing, liability for AI repair instructions [MR] |
| | - O6. Possible partnership with Quinpart (CR parts marketplace) for the alternative-parts side [CA] | - T6. EV share of new sales (~16-20%) reduces wear-part service events [MR] |

---

## 6. Risk Assessment

Severity rule: High × High = Critical; High × Medium or Medium × High = High; Medium × Medium, High × Low or Low × High = Medium; anything lower = Low.

### Risk Matrix

| # | Risk | Category | Probability | Impact | Severity |
|---|------|----------|-------------|--------|----------|
| 1 | No dealer signs within the runway (long B2B sales cycle, HQ decision in GAM) | Market | High | High | **Critical** |
| 2 | "AI predictive maintenance" can't deliver credible precision without vehicle data | Technical | High | High | **Critical** |
| 3 | First MVP milestone at risk from scope creep (due 2026-12-05) | Operational | High | High | **Critical** |
| 4 | Dealers prefer in-house apps or OEM apps over a third-party white-label | Market | High | Medium | **High** |
| 5 | Per-vehicle price rejected or negotiated far below $1.50 | Financial | Medium | High | **High** |
| 6 | Low owner activation of the app (fewer paying vehicles) | Market | Medium | High | **High** |
| 7 | 3D model per exact vehicle model is costly and slow to produce and maintain | Technical | High | Medium | **High** |
| 8 | Liability and content licensing for AI guided repairs | Legal | Medium | High | **High** |
| 9 | Founder bandwidth, burnout and lack of domain knowledge | Operational | High | Medium | **High** |
| 10 | Cash shortfall / funding gap before first revenue | Financial | High | Medium | **High** |
| 11 | Market ceiling too small to grow beyond a side business | Market | High | Low | **Medium** |
| 12 | Conflict between "propose an alternative part" and the dealer's OEM parts revenue | Market | Medium | Medium | **Medium** |
| 13 | Personal data protection non-compliance (Ley 8968, PRODHAB) and data-ownership disputes with dealers | Legal | Medium | Medium | **Medium** |
| 14 | Foreign white-label vendors enter Costa Rica | Market | Low | High | **Medium** |
| 15 | EV transition reduces maintenance events and the value of the health model | Market | Medium | Low | **Low** |
| 16 | Brand name conflict (original "PurdyPulsES"; "TwinES" not yet searched) | Legal | Low | Low | **Low** |

### Detailed Risk Analysis

#### Risk 1: No dealer signs within the runway
- **Description:** Dealer groups buy at headquarters in the GAM, compare against what they already built, and take months to decide. The model assumes the first pilot starts in month 4-9 [FM]; nothing validates that.
- **Trigger:** Branch managers in San Carlos like the demo but cannot approve; HQ IT deprioritizes it; pilots stall without conversion.
- **Impact:** Zero revenue while cash runs out around months 5-7 [FM]; project stops.
- **Mitigation:** Before building more, interview 3-5 service managers (San Carlos branches and GAM HQs) as recommended in [MR]; target mid-size or multi-brand groups without an app (Veinsa, AutoStar, Cori, Chinese-brand dealers) [CA]; offer a narrow, low-commitment pilot with a pre-agreed success metric (e.g., appointments booked from alerts) and a pre-agreed paid conversion.
- **Contingency:** Pivot to independent workshops (shorter decision cycle, priced per shop like Tekmetric at $179-$499/month [CA]) or to a consumer app with a free tier, reusing the same vehicle-history core.

#### Risk 2: Predictive maintenance can't deliver credible precision
- **Description:** Without telematics or OEM data feeds, part health is estimated from mileage, age, service records and manufacturer schedules [MR, CA]. A "green/yellow/orange/red" status that is wrong erodes trust quickly.
- **Trigger:** Owners don't update mileage; service history is incomplete; the AI shows a "green" part that then fails.
- **Impact:** The core differentiator becomes a reminder app, competing with free tools (CARFAX Car Care, Drivvo) [CA]; reputational and potential liability issues.
- **Mitigation:** Be explicit that v1 is rule-based (manufacturer intervals + mileage + service history) and present statuses as "maintenance due" estimates, not diagnostics; pull service records from the dealer workshop to fill gaps; ask for mileage at each visit and via periodic prompts; label AI output as a recommendation.
- **Contingency:** Partner later with an OBD/telematics provider or use OEM data where the dealer has access (e.g., Purdy Connect, SmartQ-type systems) [CA]; drop "AI precision" from marketing until data supports it.

#### Risk 3: First MVP milestone at risk from scope creep
- **Description:** The first milestone requires a documented, partially built application with a test plan, a test report, unit tests and automated tests by 2026-12-05 [B]. Building 3D, AI, catalog and two apps in 16 days is not feasible.
- **Trigger:** Time spent on the 3D model, AI integration or parts catalog instead of the testable core and the QA documents.
- **Impact:** Missing or weak test deliverables at the milestone.
- **Mitigation:** Freeze the MVP slice: vehicle registration → part-health status by rules → next-maintenance calculation (the slice recommended in [CA]). Use a placeholder or single generic 3D/2D model. Prioritize deterministic business logic (health thresholds, next-maintenance dates) because it yields clear unit tests; automate 3-5 end-to-end flows.
- **Contingency:** If behind schedule, drop the 3D view and AI from the MVP scope and document them as "out of scope / future work" in the test plan.

#### Risk 4: Dealers prefer in-house or OEM apps
- **Description:** Grupo Purdy and Grupo Q already own apps and telematics add-ons [CA]; OEMs are rolling out connected services in LATAM (Toyota in Argentina and Colombia) [CA].
- **Trigger:** A prospect says "we already have an app" or the OEM mandates its own app.
- **Impact:** Shrinks the target list from ~22 dealer companies to ~15-18 or fewer [MR, FM].
- **Mitigation:** Position TwinES as a module that complements existing apps (e.g., a workshop panel plus a health view embeddable in the dealer's app via API or web view) rather than a replacement; focus on dealers without apps.
- **Contingency:** Sell the workshop panel (guided repair + vehicle history) alone to dealers who keep their own owner app.

#### Risk 5: Per-vehicle price rejected
- **Description:** At $1-$3 per vehicle, an account with 1,000 vehicles pays 3-10x a full shop-management suite [CA]. The founder's price range is unvalidated [B].
- **Trigger:** Procurement compares the fee with generic software or with in-house development cost.
- **Impact:** ARPU drops; a $1 price in the pessimistic case still covers fixed costs with one account [FM], but founder salary and growth slip by years.
- **Mitigation:** Tie price to outcomes (a fee per appointment generated, or a flat branch tier with a vehicle cap); prepare a simple ROI sheet (one recovered post-warranty service visit per X vehicles pays the fee).
- **Contingency:** Flat branch subscription (e.g., in the $200-$500/month range of shop software [CA]) instead of per-vehicle pricing.

#### Risk 6: Low owner activation
- **Description:** The model assumes 20-30% of eligible owners activate the app [FM]; incumbent dealer apps have few ratings (11-16), suggesting modest usage [CA].
- **Trigger:** Owners don't download yet another app; registration friction (a complaint about Purdy Go [CA]).
- **Impact:** Paying vehicles per account fall below 500, cutting ARPU.
- **Mitigation:** Pre-register vehicles from the dealer's sales/service records; onboard at vehicle delivery and at each workshop visit; use WhatsApp/SMS alerts as a fallback channel; bill on "registered vehicles" rather than "active app users" (to be negotiated).
- **Contingency:** Shift value to the workshop panel and dealer-side alerts so the product works even when owners don't install the app.

#### Risk 7: 3D model per exact vehicle model is costly
- **Description:** The vision shows each owner's exact model in 3D with clickable parts [B]. Licensed models plus per-part segmentation for every model and year multiply the cost; the model budgets only ~$800 [FM].
- **Trigger:** A multi-brand dealer has dozens of models; new model years every year.
- **Impact:** One-time costs exceed budget; onboarding new dealers takes weeks.
- **Mitigation:** Use a small set of generic body types (sedan, hatchback, SUV, pickup, EV) with a shared part map, recolored per vehicle; add exact models only for best-sellers.
- **Contingency:** Fall back to an interactive 2D diagram, which delivers the same traffic-light status at a fraction of the cost.

#### Risk 8: Liability and licensing for AI guided repairs
- **Description:** Step-by-step repair instructions generated by AI could be wrong; repair procedures are usually licensed OEM or ALLDATA-type content [CA, MR].
- **Trigger:** A technician follows an incorrect AI step; an OEM objects to use of its manuals.
- **Impact:** Safety incidents, warranty disputes, legal claims, loss of dealer trust.
- **Mitigation:** Restrict guided repair to technicians in the dealer's workshop (not owners); ground AI output in the dealer's own licensed manuals; require technician confirmation and keep an audit log; include disclaimers and liability limits in the contract.
- **Contingency:** Remove generated instructions and keep only checklists and links to the official manual.

#### Risk 9: Founder bandwidth and domain knowledge
- **Description:** One unpaid person must build, sell, support and learn the automotive sector [B, FM].
- **Trigger:** Parallel demands (studies, job, pilots); misunderstanding of workshop workflows.
- **Impact:** Slow delivery, product that doesn't fit how workshops actually work.
- **Mitigation:** Recruit an advisor from a dealer workshop (service manager or senior technician), possibly D.E.S.N. if they are from the sector; shadow a workshop for a few days; keep v1 scope minimal.
- **Contingency:** Bring in a co-founder with sector or sales experience in exchange for equity.

#### Risk 10: Cash shortfall before first revenue
- **Description:** Lowest cash balance is −$710 to −$2,940 against a $5,000 budget [FM].
- **Trigger:** One-time costs plus CAC and free pilots land before the first payment.
- **Impact:** Unable to pay incorporation, legal or travel costs when the first pilot starts.
- **Mitigation:** Delay incorporation and paid 3D models until a pilot letter of intent exists; ask the pilot dealer to cover travel or pay a small setup fee; apply to public entrepreneurship funds.
- **Contingency:** Shorten or charge for the pilot (e.g., 50% price during the pilot).

#### Risk 11: Market ceiling
- **Description:** Base case reaches ~$67K revenue in year 3 [FM]; national SAM is ~$4M-$14M/yr [MR].
- **Trigger:** Saturation after a handful of dealer groups.
- **Impact:** Limits the business to a profitable side income.
- **Mitigation:** Design for multi-country (currency, language, brand catalogs) from the start; explore Central American groups present in several countries.
- **Contingency:** Add revenue lines (parts commissions, workshop seats, fleet clients).

#### Risk 12: Alternative-part recommendations conflict with dealer revenue
- **Description:** The product proposes an alternative to the original part [B], but the dealer's buyer earns margin on OEM parts and may not want alternatives shown.
- **Trigger:** Dealer asks to hide alternatives; owners use alternatives to leave the dealer.
- **Impact:** Feature becomes a sales objection; possible warranty disputes.
- **Mitigation:** Make the alternative-part display configurable per dealer; show OEM by default with warranty implications explained.
- **Contingency:** Keep alternatives only in the consumer/independent-shop version.

#### Risk 13: Personal data protection
- **Description:** TwinES stores owner identity, plates/VINs and service history; Ley 8968 applies and PRODHAB oversight may require registration [MR].
- **Trigger:** No consent flow, unclear controller/processor roles in the white-label contract.
- **Impact:** Fines, contract blockers in dealer procurement.
- **Mitigation:** Legal review (budgeted ~$800 [FM]); data processing agreement with each dealer; explicit consent at onboarding; data minimization.
- **Contingency:** Operate as a pure processor on the dealer's behalf, with data hosted under the dealer's ownership.

#### Risk 14: Foreign white-label vendors enter Costa Rica
- **Description:** Connected Cars, myKaarma, Xtime and Keyloop are mature but not present locally [CA].
- **Trigger:** An OEM program or a regional dealer group brings in a global vendor.
- **Impact:** Price and feature pressure.
- **Mitigation:** Compete on local language, support, price and speed of customization; lock in early customers with good service.
- **Contingency:** Position as the local implementation or integration partner.

#### Risk 15: EV transition
- **Description:** EVs are ~16-20% of new sales and have fewer wear parts [MR].
- **Trigger:** Part-health model covers only combustion components.
- **Impact:** Lower relevance for EV owners and EV-focused dealers (BYD, Xpeng).
- **Mitigation:** Include EV components (battery health, tires, brakes, cabin filter, 12V battery) in the part map from v1.
- **Contingency:** Partner with EV brands' data where available.

#### Risk 16: Brand name conflict
- **Description:** "PurdyPulsES" was dropped to avoid trademark risk [B]; "TwinES" has not been checked.
- **Trigger:** Existing registration in the Registro Nacional or app stores.
- **Impact:** Rebranding cost.
- **Mitigation:** Search the Costa Rica Registro de la Propiedad Industrial and app stores before any public launch.
- **Contingency:** Rename before incorporation; cost is low at this stage.

### Risk Summary
- **Critical risks:** 3 (no dealer signs within runway; predictive precision without data; MVP milestone scope creep)
- **High risks:** 7
- **Medium risks:** 4
- **Low risks:** 2
- **Overall risk profile:** **High.** The cost structure is safe (one account covers operating costs), but demand is unproven, the "AI precision" promise depends on data the product doesn't have yet, and the target market is small and partly served by in-house apps. Most critical risks can be reduced cheaply through dealer interviews and a narrow MVP before spending the budget.

---

## 7. Go / No-Go Recommendation

| Dimension | Score (1-5) | Weight | Weighted | Rationale |
|-----------|-------------|--------|----------|-----------|
| Market Size and Growth | 2 | 25% | 0.50 | National SAM only ~$4M-$14M/yr. Fleet grows ~7%/yr but new-car sales are flat. The retention premise has no local data |
| Competitive Position | 3 | 20% | 0.60 | The bundle is unique and incumbent apps are weak, but the two largest groups already built in-house apps and OEM apps are expanding |
| Financial Viability | 3 | 25% | 0.75 | Very lean costs, high margins and break-even with 1 account, but price, activation and churn are unvalidated, scale is small, and the $5K budget leaves a gap |
| Risk Profile | 2 | 15% | 0.30 | 3 critical and 7 high risks; the core "AI precision" promise depends on data the product lacks |
| Founder Readiness | 2 | 15% | 0.30 | Solo, unpaid, no automotive background or dealer network, bootstrapped; technical skills and local presence are assets |
| **Weighted Total** | | | **2.45 / 5.0** | |

### Verdict: NO-GO (for now): resolve the significant issues first

**Confidence Level:** Medium. The verdict rests on assumptions, and cheap primary research could move it up or down.

### Justification

1. **Demand is unproven.** No dealer has expressed interest or willingness to pay, and the sales cycle runs through headquarters in the GAM. Every scenario depends on signing the first account within 4-9 months.
2. **The differentiator lacks data.** Without telematics or OEM feeds, part health is a schedule-based estimate. That puts it close to free reminder apps unless it is presented honestly and backed by the dealer's service records.
3. **The best-known targets are already served.** Purdy and Grupo Q have their own apps, which narrows the realistic market to roughly 15-18 smaller or multi-brand accounts.
4. **The scale ceiling is low.** The base case reaches about $67K in revenue in year 3. That is a viable side business, but not one that justifies a large build or outside capital without expansion into Central America.
5. **Cost risk is low.** Thanks to the lean cost structure, validating demand is cheap. A No-Go now does not mean abandoning the idea; it means validate before you build.

### Conditions to move to CONDITIONAL GO

- At least 3 of 5 interviewed dealer service managers confirm post-warranty customer loss and accept a price of at least $1 per vehicle per month, or an equivalent flat branch fee.
- At least one dealer (Veinsa, AutoStar, Cori, a Chinese-brand dealer or a San Carlos branch) signs a letter of intent for a pilot with a pre-agreed success metric and paid conversion.
- The dealer agrees to share service records, so health status can be computed from real history and not only from owner input.
- A sector advisor (service manager or senior technician) is available to validate workshop workflows.

---

## 8. Recommended Next Steps

Ordered by priority. Steps 1-2 apply to the MVP milestone; steps 3-7 apply to the business.

1. **Freeze the MVP scope now (milestone due 2026-12-05).** Build and test only this flow: vehicle registration → rule-based part-health status (green/yellow/orange/red thresholds) → next-maintenance calculation. Use one generic 3D or 2D model. Leave AI guided repair and the parts catalog as documented future work.
2. **Design the testable core.** Put the health-threshold and next-maintenance rules in pure, deterministic functions; they map directly to the unit tests. Automate 3-5 end-to-end flows. Plan security tests around authentication and personal data, in line with Ley 8968.
3. **Interview 3-5 dealer service managers** at San Carlos branches and GAM headquarters. Test post-warranty loss, current tools and price tolerance, both per vehicle and as a flat fee.
4. **Confirm the target list.** Check whether Veinsa, AutoStar, Cori and the Chinese-brand dealers have owner apps, and who decides software purchases at each.
5. **Find a sector advisor.** Recruit a workshop advisor (possibly D.E.S.N., if they work in the sector) and shadow a dealer workshop for a few days before designing the workshop panel.
6. **Re-scope v1 for the business:** rule-based maintenance from dealer service records, generic body-type 3D models, embeddable modules for dealers that already have an app, and WhatsApp/SMS alerts. Postpone AI guided repair until content licensing and liability are resolved.
7. **Re-run this validation** with the interview data, keeping the same run structure for comparison. Spend the $5K budget on incorporation, legal review and 3D assets only after a letter of intent is signed.

---

## Sources

Consolidated from all sections (each section also lists its sources in context). The financial model and the risk assessment are synthesis and add no new external sources.

- https://delfino.cr/2026/04/detektor-parque-vehicular-costarricense-supera-los-319-millones-de-vehiculos-y-presiona-los-retos-de-sostenibilidad-del-pais
- https://observador.cr/parque-automotor-en-costa-rica-crecio-mas-del-doble-en-20-anos/
- https://crhoy.com/nacionales/presas-y-bajo-costo-impulsan-preferencia-hacia-las-motocicletas/
- https://observador.cr/vehiculos-revisados-en-costa-rica-tienen-antiguedad-de-16-anos-en-promedio/
- https://www.nacion.com/economia/mas-vehiculos-en-las-calles-este-es-el/S5BH2DGV7NH6NCEM3HWWRV556U/story/
- https://bestsellingcarsblog.com/tag/new-car-sales-statistics/page/19/
- https://bestsellingcarsblog.com/2026/08/costa-rica-h1-2026-chery-46-2-mitsubishi-28-1-among-best-performers/
- https://www.elfinancierocr.com/negocios/estas-fueron-las-marcas-de-las-cuales-mas-se/N32STZE6K5FK3HTZ6VKZYQQJSI/story/
- https://www.elfinancierocr.com/economia-y-politica/quien-es-quien-en-el-mercado-de-las-22-agencias-de/HA5LBOMPTNCDNNVASQCNDNA6AM/story/
- https://www.elfinancierocr.com/negocios/cuantas-marcas-de-carros-hay-en-costa-rica-cuales/3PHFWFRITBGAZAYWTER436TH6I/story/
- https://www.larepublica.net/noticia/grupo-purdy-motor-aumenta-flotilla-de-talleres-moviles
- https://telencuestas.com/censos-de-poblacion/costa-rica/2022/alajuela/san-carlos
- https://delfino.cr/2025/09/costa-rica-proyecta-cerrar-este-ano-con-cerca-de-35-mil-vehiculos-electricos
- https://www.elfinancierocr.com/negocios/que-espera-el-ceo-de-grupo-purdy-para-el-2025/GT5OLMET6VCENJZFKZKMZM7R4Q/story
- https://store.frost.com/growth-opportunities-in-the-automotive-aftermarket-global-2026.html
- https://www.globenewswire.com/news-release/2025/09/11/3148714/28124/en/Trends-Strategies-Shaping-the-476-Billion-Automotive-Aftermarket-2025-2030-Growth-in-Electric-and-Hybrid-Vehicles-is-Prompting-Suppliers-to-Diversify-Product-Portfolios.html
- https://www.gminsights.com/industry-analysis/predictive-maintenance-for-vehicles-market
- https://www.marketresearch.com/Diligence-Insights-v4290/Dealer-Management-System-Size-Share-40988634
- https://www.nada.org/NADAdata
- https://news.dealershipguy.com/p/new-car-boom-used-car-squeeze-and-the-future-of-fixed-ops-2025-01-30
- https://news.dealershipguy.com/p/the-hidden-risk-why-post-warranty-service-remains-dealers-biggest-missed-opportunity-2025-09-09
- https://www.wardsauto.com/news/archive-wards-best-dealers-keep-customers-after-warranties-end/773620/
- https://www.fi-magazine.com/news/aftermarket-facilities-capture-majority-of-post-warranty-auto-service-business
- https://autoflows.com/hubfs/Retention%20Benchmark%20Report_Autoflows.pdf?hsLang=en
- https://observador.cr/cada-dia-se-suman-359-carros-a-la-flota-vehicular-de-costa-rica/
- https://www.vktr.com/the-wire/lotlinx-survey-highlights-significant-challenges-in-ai-and-predictive-data-adoption-among-auto-dealers/
- https://digitaldealer.com/news/four-ways-the-automotive-aftersales-market-is-evolving/165727/
- https://qcostarica.com/riteve-comes-to-an-end-in-costa-rica
- https://www.pgr.go.cr/wp-content/uploads/2025/12/RG-190924.pdf
- https://web-assets.bcg.com/c8/3e/9ac1ec3c40df83c1634411a99e90/ai-in-the-commercial-vehicle-aftermarket-slideshow-mar-2026.pdf
- https://www.marketsandmarkets.com/Market-Reports/geography/automotive-telematics-market/Brazil
- https://apps.apple.com/us/app/id972874159
- https://dplnews.com/?p=144239
- https://apps.apple.com/us/app/id1536614177
- https://www.larepublica.net/noticia/grupo-purdy-transforma-la-experiencia-de-expomovil-2026-con-una-propuesta-digital-para-reservar-vehiculos-de-forma-simple-y-segura/
- https://observador.cr/video-grupo-purdy-introduce-sistema-para-vigilar-apagar-encender-y-controlar-el-carro-desde-el-celular/
- https://www.revistaeyn.com/empresasymanagement/grupo-purdy-que-lecciones-aprendio-a-un-ano-del-covid-19-GBEN1452040
- https://apps.apple.com/us/app/toyota-latam/id1597365457
- https://noticias.autocosmos.com.co/2025/08/20/automotores-toyota-colombia-ahora-ofrece-servicios-de-seguridad-diagnostico-y-conectividad
- https://www.mobiletime.com.br/noticias/26/04/2021/hyundai-lanca-seu-servico-de-conectividade-veicular-bluelink/
- https://www.hyundaicr.com/blog/wp-json/wp/v2/posts/1501
- https://connect.kia.com/mea/en/kia-connect-plan/
- https://www.larepublica.net/noticia/nissan-y-audi-ofrecen-app-en-costa-rica-con-showroom-virtual-y-vistas-3600
- https://delfino.cr/2025/05/autostar-mejora-su-atencion-en-la-zona-norte-con-instalaciones-renovadas-y-nuevos-servicios
- https://veinsamotors.com
- https://connectedcars.io/solution-dealers/
- https://www.pitstopconnect.com
- https://piston-docs.pages.dev/docs/one-pager.html
- https://www.tekmetric.com/pricing
- https://www.shopmonkey.io/blog/best-auto-repair-shop-management-software-2026-top-picks-compared
- https://www.capterra.com/p/216500/Autoleap/pricing/
- https://www.alldata.com/mx/en/contract-free-plans
- https://www.thepricer.org/alldata-subscription-cost/
- https://apps.apple.com/us/app/-/id552472249
- https://www.capterra.com/p/219368/Drivvo/
- https://us.fitgap.com/products/021440/mykaarma
- https://www.g2.com/products/dealer-fx/pricing
- https://www.coxautoinc.com/press-releases/cox-automotive-launches-an-enhanced-xtime-consumer-scheduler-with-a-streamlined-mobile-first-service-booking-experience/
- https://www.businesswire.com/news/home/20210823005066/en
- https://aftermarketinsight.spglobal.com/news/4404/uks-keyloop-launches-service-hub-to-manage-aftersales-journey-for-dealers-and-customers
- https://www.elfinancierocr.com/tecnologia/busca-repuestos-para-su-vehiculo-startup-tica/CGT6J3GNIRECNK5HK6IZTHPA2I/story/
- https://www.capterra.es/software/1110636/OK-CAR
- https://patents.justia.com/patent/10909779
- https://www.teletica.com/amp/nacional/sabe-usted-de-cuanto-es-la-garantia-en-la-compra-de-un-vehiculo_403906

---

*Report generated by Business Validator on 2026-11-19*
