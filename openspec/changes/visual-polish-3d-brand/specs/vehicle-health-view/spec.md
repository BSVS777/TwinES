# Delta for Vehicle Health View

Unchanged requirements (kept as they are in the main spec): "Health summary" (VIEW-01), "Accessible parts list" (VIEW-02) and "Technician actions on the view" (VIEW-08, VIEW-09).

Terms used below. A **system** is a UI-only grouping of catalog parts declared in the asset manifest (see `vehicle-3d-assets`); it has no stored status and is not a catalog part. The initial systems are `engine-bay` (engine-oil, oil-filter, air-filter, spark-plugs, coolant, battery) and `wheels` (tires, brake-pads). A system is **closed** in the overview and **focused** after drill-down. A **primitive model** is the existing box, cylinder and sphere model per body type. Scenario IDs (`VIEW-xx`) are test case identifiers; VIEW-01 to VIEW-09 keep their IDs.

## MODIFIED Requirements

### Requirement: 3D model by body type

When WebGL is available, the page MUST render a 3D vehicle model resolved through the vehicle asset manifest for the vehicle's make, model and body type (the specific shell, otherwise the generic shell of the body type), that rotates slowly around its vertical axis while nothing is selected and no system is focused. Each tracked part MUST be represented in 3D and colored by its status: a part that belongs to a system is reached through that system's hotspot and drill-down, and a part that belongs to no system has a zone directly on the shell. Clicking a part zone or selecting a list item SHALL open a detail panel for that part and pause rotation. Selecting a part from the list MUST only highlight it and open its panel: it MUST NOT open or focus a system, fade the shell or move the camera. Selecting a part by clicking its zone in a focused system MUST update the list selection.
(Previously: a generic 3D model per body type with one colored zone per part; clicking a zone or selecting a list item opened the panel, paused rotation, and highlighted the zone. There were no systems and the model was not resolved per make and model.)

#### Scenario: VIEW-03 Body type selects the model

- GIVEN a vehicle with body type `pickup` and a make and model that have no specific shell
- WHEN the page renders with WebGL available
- THEN the generic pickup shell is shown
- AND a vehicle Toyota Hilux with body type `pickup` shows the Hilux shell

#### Scenario: VIEW-04 Clicking a part zone opens details

- GIVEN the wheels system is focused
- WHEN the user clicks the brake pads zone
- THEN rotation is paused
- AND a panel shows brake pads status, usage percentage, remaining km and days, and due date

#### Scenario: VIEW-05 List selection highlights only

- GIVEN the detail panel shows brake pads and no system is focused
- WHEN the user selects engine oil in the list
- THEN the panel shows engine oil and engine oil is marked as the selected list item
- AND no system is opened: the shell stays opaque, the camera does not move and the system focus state is unchanged
- AND rotation stays paused

#### Scenario: VIEW-10 Part that belongs to no system

- GIVEN a manifest in which a part belongs to no system
- WHEN the page renders in the overview
- THEN that part has a zone directly on the shell colored by its status
- AND clicking it opens its panel and pauses rotation without any system focus

#### Scenario: VIEW-11 List selection highlights the part in the focused system

- GIVEN the engine-bay system is focused
- WHEN the user selects engine oil in the list
- THEN the panel shows engine oil
- AND the engine oil part is highlighted in the 3D view
- AND the focus state is unchanged

#### Scenario: VIEW-12 Clicking a part in a focused system updates the list

- GIVEN the engine-bay system is focused
- WHEN the user clicks the coolant zone
- THEN the panel shows coolant
- AND coolant is the only selected item in the list

### Requirement: Fallbacks and motion preferences

If WebGL is unavailable, the page MUST render a 2D diagram with the same clickable, colored zones instead of the 3D model, without systems or drill-down. If the shell or a required assembly GLB fails to load, the page MUST render the primitive model for the body type in its place, with the page free of errors and all 8 part zones directly selectable as before. If the user prefers reduced motion, the model MUST NOT auto-rotate, and focus transitions (enter and exit of a system, the shell fade and the camera move) MUST be instant.
(Previously: only the no-WebGL 2D fallback and no auto-rotation under reduced motion; there was no GLB-load fallback and no focus transition.)

#### Scenario: VIEW-06 No WebGL

- GIVEN a browser without WebGL
- WHEN the vehicle page renders
- THEN a 2D diagram with 8 colored zones is shown and the page has no errors

#### Scenario: VIEW-07 Reduced motion

- GIVEN the user's system prefers reduced motion
- WHEN the vehicle page renders
- THEN the model is shown without auto-rotation

#### Scenario: VIEW-13 Shell GLB fails to load

- GIVEN WebGL is available and the request for the resolved shell GLB is aborted
- WHEN the vehicle page renders
- THEN the primitive model for the body type is shown
- AND the page has no errors
- AND the parts list shows all 8 parts

#### Scenario: VIEW-14 Assembly GLB fails to load

- GIVEN WebGL is available and the shell loads but a system assembly request fails
- WHEN the vehicle page renders
- THEN the primitive model for the body type is shown instead of the partial model
- AND the page has no errors

#### Scenario: VIEW-15 Primitive model keeps every part reachable

- GIVEN the primitive model is shown after a GLB load error
- WHEN the user clicks any of the 8 part zones
- THEN the panel for that part opens and rotation pauses
- AND no system hotspot or drill-down is offered

#### Scenario: VIEW-16 The 2D diagram has no systems

- GIVEN a browser without WebGL and the 2D diagram is shown
- WHEN the user selects engine oil in the list
- THEN the engine oil zone is highlighted and its panel opens
- AND no system hotspot, fade or focus control is present

#### Scenario: VIEW-17 Reduced motion makes drill-down instant

- GIVEN the user's system prefers reduced motion and the model is shown
- WHEN the user activates the engine-bay hotspot and later exits the system
- THEN the shell fade and the camera focus complete in a single step with no intermediate animated frames
- AND nothing auto-rotates at any point

#### Scenario: VIEW-18 Preference changes during a transition

- GIVEN a focus transition is animating
- WHEN the reduced-motion preference turns on
- THEN the transition completes immediately
- AND no further motion occurs

## ADDED Requirements

### Requirement: System drill-down

The 3D view MUST offer one hotspot per system in the overview. Activating a system hotspot, by mouse or keyboard, is the only way to enter drill-down. Entering MUST fade the vehicle shell out, focus the camera on that system, and make that system's part hotspots selectable. The faded shell MUST NOT intercept pointer events. While a system is focused, only that system's part hotspots MUST be interactive and hotspots of other systems MUST NOT be offered. The user MUST be able to leave drill-down by pressing Escape or by activating a visible, labeled, keyboard-operable back control; leaving MUST restore the opaque shell and the overview camera. The part selection MUST be unchanged by entering or leaving. Auto-rotation MUST be paused while a system is focused and, after leaving, MUST resume only if no part is selected and reduced motion is not preferred. Keyboard focus MUST move to the back control on entering and return to the system hotspot on leaving. Repeated activation during a transition MUST have no additional effect. Escape inside an editable field MUST NOT leave drill-down, and Escape in the overview MUST do nothing.

#### Scenario: VIEW-19 Overview offers one hotspot per system

- GIVEN the model is shown in the overview
- WHEN the page renders
- THEN there is a hotspot for the engine bay and a hotspot for the wheels
- AND each hotspot has an accessible name that includes the system label

#### Scenario: VIEW-20 Mouse activation enters drill-down

- GIVEN the model is shown in the overview
- WHEN the user clicks the engine-bay hotspot
- THEN the shell fades out
- AND the camera focuses on the engine bay
- AND the 6 engine-bay part hotspots become selectable

#### Scenario: VIEW-21 Keyboard activation enters drill-down

- GIVEN keyboard focus is on the wheels hotspot
- WHEN the user presses Enter, and in a separate case Space
- THEN the wheels system is focused
- AND the tires and brake pads hotspots are selectable

#### Scenario: VIEW-22 Faded shell does not intercept clicks

- GIVEN the engine-bay system is focused
- WHEN the user clicks where the faded shell overlaps an engine-bay part
- THEN the part receives the click and its panel opens
- AND the shell does not receive the click

#### Scenario: VIEW-23 Only the focused system is interactive

- GIVEN the engine-bay system is focused
- WHEN the available hotspots are listed
- THEN the 6 engine-bay part hotspots are present
- AND the wheels system hotspot and the wheels part hotspots are not offered

#### Scenario: VIEW-24 Escape exits

- GIVEN the engine-bay system is focused
- WHEN the user presses Escape
- THEN the shell becomes opaque again and the overview camera returns
- AND the system hotspots are offered again

#### Scenario: VIEW-25 Back control exits

- GIVEN the engine-bay system is focused
- WHEN the user activates the visible back control with the mouse or the keyboard
- THEN the view returns to the overview as in the Escape case
- AND the back control has an accessible name and is reachable with Tab

#### Scenario: VIEW-26 Escape is ignored in editable fields and in the overview

- GIVEN a technician is typing a mileage in the service form while the engine-bay system is focused
- WHEN the technician presses Escape inside that field
- THEN the system stays focused
- AND pressing Escape in the overview changes nothing

#### Scenario: VIEW-27 Selection survives entering and leaving

- GIVEN engine oil is selected in the list and its panel is open
- WHEN the user enters the engine bay and then leaves it
- THEN engine oil is still selected and its panel is still open

#### Scenario: VIEW-28 Rotation pauses while focused and resumes after leaving

- GIVEN the model is rotating with nothing selected
- WHEN the user enters a system
- THEN rotation is paused
- AND after leaving, with nothing selected and motion allowed, rotation resumes
- AND after leaving with a part selected, rotation stays paused

#### Scenario: VIEW-29 Repeated activation is idempotent

- GIVEN the user activates the engine-bay hotspot
- WHEN the hotspot is activated again, or Escape is pressed, during the transition
- THEN the view ends in a single consistent state, either focused or overview, and never in a mixed state
- AND at most one enter and one exit take effect

#### Scenario: VIEW-30 Keyboard focus is managed

- GIVEN keyboard focus is on the engine-bay hotspot
- WHEN the user enters the system by keyboard
- THEN keyboard focus moves to the back control
- AND after leaving by Escape or by the back control, keyboard focus returns to the engine-bay hotspot

### Requirement: System attention indicator

A system MUST have no stored status. The system hotspot MUST show an attention indicator when at least one of the system's parts has a status worse than Green. The indicator MUST show the worst status among the system's parts as text and as color, and MUST be recomputed whenever part health changes. When all of the system's parts are Green, no indicator MUST be shown. The indicator MUST NOT change the overall status of the vehicle, the parts list, or the next maintenance computation, and MUST NOT require any database or API change.

#### Scenario: VIEW-31 Worst child status is shown

- GIVEN the engine-bay parts have statuses Green, Green, Yellow, Orange, Red and Green
- WHEN the overview renders
- THEN the engine-bay hotspot shows an indicator with the text "Red" and the Red status color

#### Scenario: VIEW-32 Yellow is enough

- GIVEN all wheels parts are Green except tires, which is Yellow
- WHEN the overview renders
- THEN the wheels hotspot shows an indicator with the text "Yellow" and the Yellow status color

#### Scenario: VIEW-33 No indicator when all parts are Green

- GIVEN all parts of the engine bay are Green
- WHEN the overview renders
- THEN the engine-bay hotspot shows no attention indicator

#### Scenario: VIEW-34 Indicator updates after a service

- GIVEN a technician views a vehicle whose only non-Green engine-bay part is engine oil, Orange
- WHEN the technician marks engine oil as serviced and the page data refreshes
- THEN the engine-bay hotspot shows no attention indicator

#### Scenario: VIEW-35 Indicator is not color only

- GIVEN a system with an Orange worst child
- WHEN the overview renders and assistive technology reads the system hotspot
- THEN the status is present as visible text and in the accessible name, for example "Engine bay, attention: Orange"

#### Scenario: VIEW-36 Overall status is unchanged

- GIVEN a vehicle with overall status Orange
- WHEN system indicators are shown for all systems
- THEN the overall status, the parts list statuses and the next maintenance are exactly those computed without the indicators

### Requirement: Selected-part marker on closed systems

When the selected part belongs to a closed system, the system hotspot MUST indicate that it contains the selected part, as text available to assistive technology and as a visible marker that is not color only. The marker MUST follow the selection, MUST be shown together with the attention indicator when both apply, MUST NOT be shown when nothing is selected or the selection is outside the system, and MUST NOT be shown for a focused system, where the selected part itself is highlighted instead.

#### Scenario: VIEW-37 Marker shown for a selected part in a closed system

- GIVEN no system is focused
- WHEN the user selects engine oil in the list
- THEN the engine-bay hotspot shows a marker that it contains the selected part
- AND its accessible name states that it contains the selected part
- AND the wheels hotspot shows no marker

#### Scenario: VIEW-38 No marker without a relevant selection

- GIVEN nothing is selected
- WHEN the overview renders
- THEN no system hotspot shows the marker

#### Scenario: VIEW-39 Marker follows the selection

- GIVEN engine oil is selected and the engine-bay hotspot shows the marker
- WHEN the user selects brake pads in the list
- THEN the wheels hotspot shows the marker
- AND the engine-bay hotspot no longer shows it

#### Scenario: VIEW-40 Marker and attention indicator coexist

- GIVEN engine oil is selected and the engine-bay worst status is Orange
- WHEN the overview renders
- THEN the engine-bay hotspot shows both the Orange attention indicator and the contains-selected-part marker

#### Scenario: VIEW-41 Focused system shows the highlighted part instead

- GIVEN engine oil is selected and the engine-bay hotspot shows the marker
- WHEN the user enters the engine bay
- THEN the engine oil part is highlighted in the 3D view
- AND no contains-selected-part marker is shown for the focused system

### Requirement: Accessible hotspots and complete parts list

Every hotspot, for systems and for parts, MUST be a real, keyboard-focusable control with an accessible name that includes its label and, for parts, its status text. The parts list MUST remain complete (8 parts) and operable in the overview, during drill-down and in the fallbacks, and remains the source of truth for automated tests and assistive technology. While the model is loading, the page MUST expose an accessible loading state and the parts list MUST remain usable.

#### Scenario: VIEW-42 Hotspots are real named buttons

- GIVEN the model is shown
- WHEN the hotspots of the overview and of a focused system are listed
- THEN each system hotspot is a button named with the system label and its attention and selected-part state
- AND each part hotspot is a button named with the part and its status text, reachable with Tab

#### Scenario: VIEW-43 List stays complete and in sync in every state

- GIVEN the model is in the overview, then in a focused system, then back in the overview
- WHEN the parts list is read in each state
- THEN it shows all 8 parts with the same text status each time
- AND the selected part is marked in the list in each state

#### Scenario: VIEW-44 Loading state is accessible

- GIVEN the GLB files are still loading
- WHEN the page renders
- THEN a status message announces that the model is loading
- AND the parts list and the detail panel can already be used
- AND the message is removed when the model is ready or when the fallback is shown
