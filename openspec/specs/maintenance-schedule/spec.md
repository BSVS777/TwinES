# Maintenance Schedule Specification

## Purpose

Calculation of when each part is due for service and of the vehicle's next recommended maintenance visit. Scenario IDs (`MNT-xx`) are test case identifiers.

## Requirements

### Requirement: Part due date and due mileage

For each part the system MUST compute:

- due mileage = baseline mileage + km interval (omitted for time-only parts)
- time-based due date = baseline date + (month interval × 30) days
- km-based due date = today + ceil((due mileage − current mileage) / (estimated monthly mileage / 30)) days, only when estimated monthly mileage > 0 and the part has a km interval
- effective due date = the earlier of the applicable due dates

The clock MUST be an input so results are deterministic.

#### Scenario: MNT-01 Km projection is earlier

- GIVEN engine oil with baseline 40,000 km on 2026-11-01, current mileage 44,000, monthly mileage 1,500, today 2026-11-19
- WHEN its due date is computed
- THEN due mileage is 45,000
- AND km-based due date is today + 20 days = 2026-12-09
- AND time-based due date is 2026-11-01 + 180 days = 2027-04-30
- AND effective due date is 2026-12-09

#### Scenario: MNT-02 Zero monthly mileage

- GIVEN a vehicle with estimated monthly mileage 0
- WHEN due dates are computed
- THEN only time-based due dates are used

#### Scenario: MNT-03 Time-only part

- GIVEN battery with baseline date 2025-01-01
- WHEN its due date is computed
- THEN effective due date is 2025-01-01 + 1,080 days and no due mileage is reported

### Requirement: Overdue parts

A part MUST be marked overdue when its effective due date is today or earlier, or when the current mileage is at or above its due mileage.

#### Scenario: MNT-04 Overdue by mileage

- GIVEN engine oil with due mileage 45,000 and current mileage 45,000
- WHEN the schedule is computed
- THEN engine oil is overdue

#### Scenario: MNT-05 Overdue by date

- GIVEN a part whose time-based due date was yesterday
- WHEN the schedule is computed
- THEN the part is overdue

### Requirement: Next recommended maintenance

The vehicle's next recommended maintenance MUST be:

- date: the earliest effective due date among all parts; if any part is overdue, the date SHALL be today and the visit is flagged "overdue"
- parts: every part whose effective due date falls within 30 days after that date (grouped into one visit)
- estimated mileage at the visit: current mileage + estimated monthly mileage / 30 × days until the visit, rounded to the nearest km

#### Scenario: MNT-06 Earliest part sets the date

- GIVEN parts due on 2026-12-09, 2026-12-20, 2027-02-01 and later, today 2026-11-19, current mileage 44,000, monthly mileage 1,500
- WHEN the next maintenance is computed
- THEN the date is 2026-12-09
- AND it groups the parts due on 2026-12-09 and 2026-12-20 (within 30 days)
- AND the estimated mileage is 45,000

#### Scenario: MNT-07 Overdue visit

- GIVEN one part is overdue
- WHEN the next maintenance is computed
- THEN the date is today and the visit is flagged "overdue"
- AND the overdue part is included

#### Scenario: MNT-08 Recalculated after service

- GIVEN the next maintenance is set by engine oil
- WHEN a technician records engine oil as serviced
- THEN the next maintenance is recomputed from the remaining parts and the new engine oil baseline
