# Part Health Specification

## Purpose

Deterministic, rule-based estimation of how worn each tracked part is, expressed as a usage ratio and a color status. Intervals are generic defaults, not manufacturer data. Scenario IDs (`HLT-xx`) are test case identifiers.

## Requirements

### Requirement: Generic maintenance catalog

The system MUST provide exactly these 8 combustion-engine parts with generic service intervals. An interval of "none" means the part is tracked only by time.

| Part id | Name | Km interval | Month interval |
|---------|------|-------------|----------------|
| `engine-oil` | Engine oil | 5,000 | 6 |
| `oil-filter` | Oil filter | 5,000 | 6 |
| `air-filter` | Air filter | 15,000 | 12 |
| `brake-pads` | Brake pads | 30,000 | 24 |
| `tires` | Tires | 50,000 | 48 |
| `battery` | Battery | none | 36 |
| `coolant` | Coolant | 40,000 | 24 |
| `spark-plugs` | Spark plugs | 30,000 | 36 |

#### Scenario: HLT-01 Catalog content

- GIVEN the maintenance catalog
- WHEN it is read
- THEN it contains exactly the 8 parts above with those intervals

### Requirement: Usage ratio

For each part the system MUST compute:

- km ratio = (current mileage − baseline mileage) / km interval (omitted when the km interval is none)
- time ratio = (days between baseline date and today) / (month interval × 30)
- usage ratio = the greater of the applicable ratios

The computation MUST be deterministic for a given vehicle, part and "today" date (the clock is an input).

#### Scenario: HLT-02 Km dominates

- GIVEN engine oil with baseline 40,000 km set 30 days ago and current mileage 44,000
- WHEN its usage ratio is computed
- THEN km ratio is 0.80, time ratio is 30/180 ≈ 0.17, and usage ratio is 0.80

#### Scenario: HLT-03 Time dominates

- GIVEN air filter with baseline 44,000 km set 300 days ago and current mileage 45,000
- WHEN its usage ratio is computed
- THEN km ratio ≈ 0.07, time ratio = 300/360 ≈ 0.83, and usage ratio ≈ 0.83

#### Scenario: HLT-04 Time-only part

- GIVEN battery with baseline date 540 days ago
- WHEN its usage ratio is computed
- THEN usage ratio is 540/1080 = 0.50 and no km ratio is used

#### Scenario: HLT-05 Just serviced

- GIVEN a part whose baseline equals the current mileage and today's date
- WHEN its usage ratio is computed
- THEN usage ratio is 0

### Requirement: Color status

The system MUST map the usage ratio to a status with lower bounds inclusive:

| Status | Usage ratio |
|--------|-------------|
| green | < 0.50 |
| yellow | 0.50 to < 0.75 |
| orange | 0.75 to < 1.00 |
| red | ≥ 1.00 |

#### Scenario: HLT-06 Threshold boundaries

- GIVEN usage ratios 0.4999, 0.50, 0.7499, 0.75, 0.9999, 1.00 and 2.5
- WHEN each is mapped to a status
- THEN the statuses are green, yellow, yellow, orange, orange, red and red

### Requirement: Remaining life

For each part the system MUST report the remaining km until its km interval is reached (omitted for time-only parts) and the remaining days until its time interval is reached. Negative values SHALL be reported as overdue amounts.

#### Scenario: HLT-07 Remaining values

- GIVEN engine oil with baseline 40,000 km set 30 days ago and current mileage 44,000
- WHEN remaining life is computed
- THEN remaining km is 1,000 and remaining days is 150

#### Scenario: HLT-08 Overdue values

- GIVEN engine oil with baseline 38,000 km and current mileage 44,000
- WHEN remaining life is computed
- THEN it reports 1,000 km overdue

### Requirement: Vehicle overall status

The vehicle's overall status MUST be the worst status among its parts (red > orange > yellow > green).

#### Scenario: HLT-09 Worst part wins

- GIVEN a vehicle with 6 green parts, 1 yellow and 1 orange
- WHEN its overall status is computed
- THEN the overall status is orange

### Requirement: Estimator extension point

Health estimation MUST be accessed through an estimator interface so a future AI-based estimator can replace the rule-based one without changing callers. Only the rule-based estimator SHALL exist in this change.

#### Scenario: HLT-10 Rule-based estimator is the default

- GIVEN the application configuration
- WHEN part health is requested
- THEN the rule-based estimator produces the result
