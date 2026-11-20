# Vehicle Registry Specification

## Purpose

Registration and management of vehicles by their owners, per-part service baselines, and technician lookup and service recording. Scenario IDs (`VEH-xx`) are test case identifiers.

## Requirements

### Requirement: Register a vehicle

An owner MUST be able to register a vehicle with these fields and rules:

| Field | Rule |
|-------|------|
| Plate | Required, 1-8 characters, letters, digits or hyphen; stored uppercase; unique across the system |
| Make | Required, 1-50 characters |
| Model | Required, 1-50 characters |
| Year | Required integer between 1990 and current year + 1 |
| Body type | Required, one of `sedan`, `hatchback`, `suv`, `pickup` |
| Current mileage (km) | Required integer between 0 and 1,000,000 |
| Purchase date | Required, not in the future |
| Estimated monthly mileage (km) | Optional integer between 0 and 10,000; defaults to 1,000 |

The registered vehicle SHALL belong to the signed-in owner.

#### Scenario: VEH-01 Successful registration

- GIVEN a signed-in owner
- WHEN they register plate "abc-123", make "Toyota", model "Corolla", year 2020, body type `sedan`, mileage 45000, purchase date 2020-03-01
- THEN the vehicle is saved with plate "ABC-123" and owned by that owner
- AND it appears in their vehicle list

#### Scenario: VEH-02 Duplicate plate rejected

- GIVEN a vehicle with plate "ABC-123" exists (any owner)
- WHEN an owner registers plate "abc-123"
- THEN the vehicle is not saved and the form shows "This plate is already registered"

#### Scenario: VEH-03 Field validation

- GIVEN the registration form
- WHEN the owner submits year 1989, or mileage -1, or a purchase date tomorrow, or body type "truck", or a plate of 9 characters
- THEN the vehicle is not saved
- AND each invalid field shows its own error message

#### Scenario: VEH-04 Default monthly mileage

- GIVEN the registration form
- WHEN the owner leaves estimated monthly mileage empty
- THEN the vehicle is saved with estimated monthly mileage 1000

### Requirement: Per-part service baseline

Each vehicle MUST have one service baseline (last service mileage and last service date) for each of the 8 catalog parts. When the owner does not provide one, the baseline SHALL default to mileage 0 and the purchase date (conservative assumption: never serviced). A baseline's mileage MUST NOT exceed the vehicle's current mileage, and its date MUST NOT be in the future.

#### Scenario: VEH-05 Default baselines on registration

- GIVEN an owner registers a vehicle with purchase date 2020-03-01 and no baselines
- WHEN the vehicle is saved
- THEN all 8 parts have baseline mileage 0 and baseline date 2020-03-01

#### Scenario: VEH-06 Owner sets a baseline

- GIVEN a vehicle with current mileage 45000
- WHEN the owner sets the engine oil baseline to 42000 km on 2026-09-01
- THEN the engine oil baseline is saved with those values

#### Scenario: VEH-07 Invalid baseline rejected

- GIVEN a vehicle with current mileage 45000
- WHEN the owner sets a baseline of 46000 km, or a baseline date in the future
- THEN the baseline is not saved and an error message is shown

### Requirement: List, view, edit and delete own vehicles

An owner MUST be able to list, view, edit and delete only the vehicles they own. Edits MUST follow the registration rules, and current mileage MUST NOT decrease (odometer rollback protection). Deletion MUST require confirmation and SHALL remove the vehicle's baselines.

#### Scenario: VEH-08 Owner sees only own vehicles

- GIVEN owner A has 2 vehicles and owner B has 1 vehicle
- WHEN owner A opens the vehicle list
- THEN exactly owner A's 2 vehicles are listed

#### Scenario: VEH-09 Mileage cannot decrease

- GIVEN a vehicle with current mileage 45000
- WHEN the owner edits the mileage to 44000
- THEN the change is rejected with "Mileage cannot be lower than the current value"

#### Scenario: VEH-10 Delete with confirmation

- GIVEN an owner viewing their vehicle
- WHEN they choose delete and confirm
- THEN the vehicle and its baselines are removed and it no longer appears in the list

#### Scenario: VEH-11 Empty list state

- GIVEN a signed-in owner with no vehicles
- WHEN they open the vehicle list
- THEN they see an empty state message with a "Register vehicle" action

### Requirement: Ownership isolation

An owner MUST NOT read, edit or delete a vehicle owned by someone else. Such requests SHALL respond as if the vehicle did not exist (404), so vehicle existence is not disclosed.

#### Scenario: VEH-12 Cross-owner read denied

- GIVEN owner B's vehicle with id X
- WHEN owner A requests vehicle X's page or API resource
- THEN the response is 404

#### Scenario: VEH-13 Cross-owner modification denied

- GIVEN owner B's vehicle with id X
- WHEN owner A submits an edit or delete for vehicle X
- THEN the response is 404 and vehicle X is unchanged

### Requirement: Technician lookup and service recording

A technician MUST be able to find any vehicle by exact plate (case-insensitive), view its part health, and record that a part was serviced. Recording a service MAY first update the current mileage (never lower than the current value) and SHALL set that part's baseline to the current mileage and today's date. Technicians MUST NOT edit vehicle details or delete vehicles.

#### Scenario: VEH-14 Technician finds a vehicle by plate

- GIVEN a vehicle with plate "ABC-123"
- WHEN a technician searches "abc-123"
- THEN the vehicle's health page is shown

#### Scenario: VEH-15 Plate not found

- GIVEN no vehicle with plate "ZZZ-999"
- WHEN a technician searches "ZZZ-999"
- THEN the page shows "No vehicle found for this plate"

#### Scenario: VEH-16 Technician records a serviced part

- GIVEN a vehicle at 45000 km whose engine oil is red
- WHEN a technician records engine oil as serviced, updating mileage to 45200
- THEN the vehicle's mileage is 45200
- AND the engine oil baseline is 45200 km with today's date
- AND the engine oil status becomes green

#### Scenario: VEH-17 Technician cannot edit or delete

- GIVEN a signed-in technician
- WHEN they submit a vehicle edit or delete request
- THEN the response is 403 and the vehicle is unchanged
