# Vehicle Health View Specification

## Purpose

The vehicle page that presents part health and the next recommended maintenance, with a rotating generic 3D model and an accessible equivalent. Scenario IDs (`VIEW-xx`) are test case identifiers.

## Requirements

### Requirement: Health summary

The vehicle page MUST show the vehicle's plate, make, model, year, current mileage, overall status and next recommended maintenance (date, estimated mileage, grouped parts, overdue flag). It MUST show a notice that intervals are generic and not manufacturer data.

#### Scenario: VIEW-01 Summary content

- GIVEN an owner's vehicle with overall status orange and next maintenance on 2026-12-09
- WHEN the owner opens the vehicle page
- THEN the page shows the vehicle details, "Orange" overall status, the date 2026-12-09, its estimated mileage and the grouped parts
- AND it shows the generic-intervals notice

### Requirement: Accessible parts list

The page MUST show all 8 parts in a list with name, status as text and color (color is never the only cue), usage as a percentage, remaining km and days, and due date. The list SHALL be the source of truth for automated tests and assistive technology.

#### Scenario: VIEW-02 All parts listed with text status

- GIVEN a vehicle with computed health
- WHEN its page renders
- THEN 8 list items are shown, each with part name, status text (Green, Yellow, Orange, Red) and usage percentage

### Requirement: 3D model by body type

When WebGL is available, the page MUST render a generic 3D model matching the vehicle's body type that rotates slowly around its vertical axis. Each tracked part MUST have a zone on the model colored by its status. Clicking a zone (or selecting a list item) SHALL open a detail panel for that part and pause rotation.

#### Scenario: VIEW-03 Body type selects the model

- GIVEN a vehicle with body type `pickup`
- WHEN the page renders with WebGL available
- THEN the pickup model is shown

#### Scenario: VIEW-04 Clicking a part zone opens details

- GIVEN the 3D model is rotating
- WHEN the user clicks the brake pads zone
- THEN rotation pauses
- AND a panel shows brake pads status, usage percentage, remaining km and days, and due date

#### Scenario: VIEW-05 List and model stay in sync

- GIVEN the detail panel shows brake pads
- WHEN the user selects engine oil in the list
- THEN the panel shows engine oil and the engine oil zone is highlighted

### Requirement: Fallbacks and motion preferences

If WebGL is unavailable, the page MUST render a 2D diagram with the same clickable, colored zones instead of the 3D model. If the user prefers reduced motion, the model MUST NOT auto-rotate.

#### Scenario: VIEW-06 No WebGL

- GIVEN a browser without WebGL
- WHEN the vehicle page renders
- THEN a 2D diagram with 8 colored zones is shown and the page has no errors

#### Scenario: VIEW-07 Reduced motion

- GIVEN the user's system prefers reduced motion
- WHEN the vehicle page renders
- THEN the model is shown without auto-rotation

### Requirement: Technician actions on the view

When a technician views a vehicle, the detail panel MUST offer a "Mark as serviced" action for the selected part. Owners MUST NOT see this action.

#### Scenario: VIEW-08 Technician sees the service action

- GIVEN a technician viewing a vehicle's engine oil details
- WHEN the panel renders
- THEN a "Mark as serviced" action is shown

#### Scenario: VIEW-09 Owner does not see the service action

- GIVEN an owner viewing their vehicle's engine oil details
- WHEN the panel renders
- THEN no "Mark as serviced" action is shown
