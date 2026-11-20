# Test traceability

Every scenario ID of the specifications (`openspec/changes/twines-mvp/specs/*/spec.md`) mapped to the tests that prove it, layer by layer. Test titles start with the scenario ID, so any test can be found with a search for the ID, for example `grep -rn "AUTH-10" twines/tests`.

How to read it:

- Paths are relative to `twines/tests/`. After each path come the titles of the tests that carry the ID (the ID itself is dropped from the title when it is the only one).
- Unit covers the domain rules, the use cases (with in-memory fakes), validation, HTTP handlers and seed data; Integration runs the Prisma repositories against SQLite; Component renders the React components in jsdom; E2E drives the production build in Chromium (see `README.md` for the commands).
- A `-` means the layer has no test for that scenario. Manual references point to [manual-tests.md](manual-tests.md).

Status: 59 of 59 scenarios have at least one automated test, 31 also have an end-to-end test. Scenarios with neither an automated test nor a manual check (GAP): none.

## Coverage matrix

| ID | Unit | Integration | Component | E2E | Manual |
|----|:----:|:-----------:|:---------:|:---:|:------:|
| AUTH-01 | x | - | x | x | - |
| AUTH-02 | x | - | x | - | - |
| AUTH-03 | x | - | x | - | - |
| AUTH-04 | x | - | x | - | - |
| AUTH-05 | x | - | - | - | - |
| AUTH-06 | x | - | - | - | - |
| AUTH-07 | x | - | x | x | - |
| AUTH-08 | x | - | x | x | - |
| AUTH-09 | x | - | - | x | - |
| AUTH-10 | x | - | x | x | - |
| AUTH-11 | x | - | - | - | - |
| AUTH-12 | x | - | x | x | - |
| AUTH-13 | x | - | - | x | - |
| AUTH-14 | x | - | - | x | - |
| AUTH-15 | x | - | x | x | - |
| VEH-01 | x | - | x | x | - |
| VEH-02 | x | - | x | x | - |
| VEH-03 | x | - | x | x | - |
| VEH-04 | x | - | x | x | - |
| VEH-05 | x | - | - | - | - |
| VEH-06 | x | - | x | - | - |
| VEH-07 | x | - | x | - | - |
| VEH-08 | x | - | x | x | - |
| VEH-09 | x | x | x | x | - |
| VEH-10 | x | - | x | x | - |
| VEH-11 | x | - | x | x | - |
| VEH-12 | x | - | - | x | - |
| VEH-13 | x | - | - | x | - |
| VEH-14 | x | - | x | x | - |
| VEH-15 | x | - | x | x | - |
| VEH-16 | x | - | x | x | - |
| VEH-17 | x | - | x | x | - |
| HLT-01 | x | - | - | - | - |
| HLT-02 | x | - | - | - | - |
| HLT-03 | x | - | - | - | - |
| HLT-04 | x | - | - | - | - |
| HLT-05 | x | - | - | - | - |
| HLT-06 | x | - | - | - | - |
| HLT-07 | x | - | - | - | - |
| HLT-08 | x | - | - | - | - |
| HLT-09 | x | - | - | - | - |
| HLT-10 | x | - | - | - | - |
| MNT-01 | x | - | - | - | - |
| MNT-02 | x | - | - | - | - |
| MNT-03 | x | - | - | - | - |
| MNT-04 | x | - | - | - | - |
| MNT-05 | x | - | - | - | - |
| MNT-06 | x | - | - | - | - |
| MNT-07 | x | - | - | - | - |
| MNT-08 | x | - | - | - | - |
| VIEW-01 | - | - | x | x | - |
| VIEW-02 | x | - | x | x | - |
| VIEW-03 | x | - | x | - | x |
| VIEW-04 | - | - | x | x | x |
| VIEW-05 | x | - | x | x | x |
| VIEW-06 | - | - | x | x | x |
| VIEW-07 | - | - | x | x | x |
| VIEW-08 | - | - | x | x | - |
| VIEW-09 | - | - | x | x | - |

## User authentication and authorization (AUTH)

| ID | Scenario | Unit | Integration | Component | E2E | Manual |
|----|----------|------|-------------|-----------|-----|--------|
| AUTH-01 | Successful sign-up | `unit/application/auth/sign-up-with-session.test.ts`: creates the owner and starts a session without going through sign-in; still succeeds when the email was locked by failed attempts before the account existed<br>`unit/application/auth/sign-up.test.ts`: creates an owner account with a lowercase, trimmed email<br>`unit/infrastructure/http/auth-handlers.test.ts`: creates an owner, signs them in and returns only the public user; signs up and sets the cookie even when the email was locked by earlier failed sign-ins | - | `component/forms/sign-up-form.test.tsx`: posts the new account and goes to the vehicle list on success | `e2e/auth.spec.ts`: a visitor signs up, is stored in lowercase as an owner and lands on the vehicle list | - |
| AUTH-02 | Duplicate email rejected | `unit/application/auth/sign-up.test.ts`: rejects a duplicate email regardless of letter case; reports a duplicate email lost to a concurrent sign-up with the same message<br>`unit/infrastructure/http/auth-handlers.test.ts`: answers 409 with the duplicate email message under the email field | - | `component/forms/sign-up-form.test.tsx`: shows the duplicate email message under the email field | - | - |
| AUTH-03 | Weak password rejected | `unit/application/auth/sign-up.test.ts`: rejects a password without a digit and explains the rule; rejects a password that is %s; accepts a password that is exactly 8 characters with a letter and a digit<br>`unit/infrastructure/http/auth-handlers.test.ts`: AUTH-03 and AUTH-04 answer 400 with one message per invalid field | - | `component/forms/sign-up-form.test.tsx`: explains the password rule next to the password field | - | - |
| AUTH-04 | Invalid email rejected | `unit/application/auth/sign-up.test.ts`: rejects an invalid email<br>`unit/infrastructure/http/auth-handlers.test.ts`: AUTH-03 and AUTH-04 answer 400 with one message per invalid field | - | `component/forms/sign-up-form.test.tsx`: shows the invalid email message next to the email field | - | - |
| AUTH-05 | Password is never stored in plain text | `unit/application/auth/sign-up.test.ts`: stores the hash from the password hasher and never the plain password<br>`unit/infrastructure/auth/bcrypt-hasher.test.ts`: produces a salted bcrypt hash that differs from the plain password | - | - | - | - |
| AUTH-06 | Role cannot be injected at sign-up | `unit/application/auth/sign-up.test.ts`: ignores a role supplied in the input<br>`unit/infrastructure/http/auth-handlers.test.ts`: ignores a role in the request | - | - | - | - |
| AUTH-07 | Successful sign-in | `unit/application/auth/sign-in.test.ts`: successful sign-in<br>`unit/infrastructure/http/auth-handlers.test.ts`: signs in and returns the public user with a session cookie | - | `component/forms/sign-in-form.test.tsx`: posts the credentials and goes to the vehicle list on success | `e2e/auth.spec.ts`: an owner signs in and lands on the vehicle list | - |
| AUTH-08 | Wrong password or unknown email | `unit/application/auth/sign-in.test.ts`: wrong password or unknown email<br>`unit/infrastructure/http/auth-handlers.test.ts`: answers 401 with the same generic message for a wrong password and an unknown email | - | `component/forms/sign-in-form.test.tsx`: shows the generic message and stays on the page for a failed sign-in | `e2e/auth.spec.ts`: a wrong password and an unknown email give the identical generic message | - |
| AUTH-09 | Session cookie flags | `unit/infrastructure/auth/session-cookie.test.ts`: sets an httpOnly, SameSite=Lax cookie on the whole site for 7 days (AUTH-09)<br>`unit/infrastructure/http/auth-handlers.test.ts`: sets the session cookie httpOnly and SameSite=Lax; sets the cookie httpOnly, SameSite=Lax, for 7 days, without Secure outside production | - | - | `e2e/api-security.spec.ts`: the session cookie is HttpOnly and SameSite=Lax | - |
| AUTH-10 | Lockout after repeated failures | `unit/application/auth/sign-in.test.ts`: lockout after repeated failures<br>`unit/infrastructure/http/auth-handlers.test.ts`: answers 429 once the email is locked, even for the correct password | - | `component/forms/sign-in-form.test.tsx`: shows the lockout message from a 429 response | `e2e/auth.spec.ts`: the sixth sign-in is locked out after five failures, even with the correct password | - |
| AUTH-11 | Lockout expires | `unit/application/auth/sign-in.test.ts`: lockout expiry and reset | - | - | - | - |
| AUTH-12 | Sign-out invalidates the session | `unit/application/auth/sign-in.test.ts`: sign-out and current user<br>`unit/infrastructure/http/auth-handlers.test.ts`: deletes the session, clears the cookie and leaves the old token unauthenticated | - | `component/auth/sign-out-button.test.tsx`: posts to the sign-out endpoint and returns to the sign-in page | `e2e/auth.spec.ts`: after sign-out the old session cookie is treated as unauthenticated at page level | - |
| AUTH-13 | Anonymous user is redirected | `unit/proxy.test.ts`: proxy (AUTH-13 route protection) | - | - | `e2e/auth.spec.ts`: an anonymous visitor is redirected to sign-in | - |
| AUTH-14 | Anonymous API call is rejected | `unit/infrastructure/http/technician-handlers.test.ts`: anonymous requests<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: anonymous requests | - | - | `e2e/api-security.spec.ts`: anonymous calls to the vehicle and technician APIs are answered with 401 | - |
| AUTH-15 | Owner cannot use technician features | `unit/application/technician/find-vehicle-by-plate.test.ts`: refuses an owner with Forbidden, even for a plate that exists<br>`unit/application/technician/record-service.test.ts`: refuses an owner with Forbidden, even on their own vehicle, and changes nothing<br>`unit/infrastructure/http/technician-handlers.test.ts`: owners<br>`unit/next-config.test.ts`: enables authInterrupts so wrong-role pages can answer a real 403 through forbidden() | - | `component/forbidden.test.tsx`: tells the visitor access is denied under a main landmark<br>`component/pages/role-pages.test.tsx`: forbids an owner with a real 403 | `e2e/api-security.spec.ts`: an owner gets 403 from the technician API and from the technician page | - |

## Vehicle registry and technician flow (VEH)

| ID | Scenario | Unit | Integration | Component | E2E | Manual |
|----|----------|------|-------------|-----------|-----|--------|
| VEH-01 | Successful registration | `unit/application/validation/vehicle.test.ts`: accepts the example registration and normalizes the plate<br>`unit/application/vehicles/register-vehicle.test.ts`: saves the vehicle with an uppercase plate, owned by the signed-in owner; ignores an ownerId in the input: the vehicle always belongs to the actor<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 201 with the vehicle saved uppercase and owned by the signed-in owner | - | `component/forms/vehicle-form.test.tsx`: posts numbers as numbers, leaves the monthly mileage out when empty, then shows the list | `e2e/vehicles.spec.ts`: an owner registers a vehicle: the plate is stored uppercase and it appears in their list | - |
| VEH-02 | Duplicate plate rejected | `unit/application/vehicles/register-vehicle.test.ts`: rejects a plate that exists, whoever owns it and however it is cased; reports a plate taken between the lookup and the insert as the same conflict<br>`unit/application/vehicles/update-vehicle.test.ts`: plate uniqueness on edit<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 409 with the duplicate plate message under the plate field | - | `component/forms/vehicle-form.test.tsx`: shows the duplicate plate message under the plate field | `e2e/vehicles.spec.ts`: a plate that is already registered is rejected, whoever owns it | - |
| VEH-03 | Field validation | `unit/application/validation/vehicle.test.ts`: gives each invalid field its own message in one pass; accepts %j as %j (1 to 8 letters, digits or hyphens); rejects 9 characters but accepts 8; requires a plate (%j); rejects %j: only letters, digits and hyphens; accepts 1990 and next year, rejects 1989 and the year after next; rejects %j; accepts 0 and 1,000,000, rejects -1 and 1,000,001; accepts today and any past day, rejects tomorrow; applies the registration length limit after normalization; applies the registration character rule to %j<br>`unit/application/vehicles/register-vehicle.test.ts`: rejects invalid fields with one message each and saves nothing; takes today from the clock: a purchase date after it is refused, on it is accepted<br>`unit/application/vehicles/update-vehicle.test.ts`: applies the registration rules to the fields it receives<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 400 with one message per invalid field | - | `component/forms/vehicle-form.test.tsx`: shows each invalid field's own message next to that field | `e2e/vehicles.spec.ts`: every invalid field shows its own message and nothing is saved | - |
| VEH-04 | Default monthly mileage | `unit/application/validation/vehicle.test.ts`: defaults to 1000 when omitted<br>`unit/application/vehicles/register-vehicle.test.ts`: saves monthly mileage 1000 when it is omitted, and keeps an explicit value<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: defaults the monthly mileage to 1000 | - | `component/forms/vehicle-form.test.tsx`: tells the owner the monthly mileage is optional and defaults to 1,000 km | `e2e/vehicles.spec.ts`: an empty monthly mileage is saved as 1,000 km | - |
| VEH-05 | Default baselines on registration | `unit/application/vehicles/register-vehicle.test.ts`: creates all 8 baselines at 0 km on the purchase date | - | - | - | - |
| VEH-06 | Owner sets a baseline | `unit/application/validation/vehicle.test.ts`: accepts a part, a mileage and a date<br>`unit/application/vehicles/set-baseline.test.ts`: saves the owner's baseline for that part and returns it<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 200 and saves the baseline | - | `component/forms/baseline-form.test.tsx`: puts the baseline for the chosen part, with the mileage as a number, and confirms it | - | - |
| VEH-07 | Invalid baseline rejected | `unit/application/validation/vehicle.test.ts`: accepts mileage 0, rejects negatives, fractions and text; accepts today, rejects a future date and an impossible one<br>`unit/application/vehicles/set-baseline.test.ts`: invalid baselines<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 400 for a baseline above the current mileage | - | `component/forms/baseline-form.test.tsx`: shows the rejection next to the mileage field and does not confirm; shows a future date rejection next to the date field | - | - |
| VEH-08 | Owner sees only own vehicles | `unit/application/vehicles/list-vehicles.test.ts`: lists exactly the actor's own vehicles<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: lists only the signed-in owner's vehicles | - | `component/vehicles/vehicle-list.test.tsx`: shows each vehicle's plate, make, model, year and mileage | `e2e/vehicles.spec.ts`: an owner sees only their own vehicles | - |
| VEH-09 | Mileage cannot decrease | `unit/application/technician/record-service.test.ts`: rejects a mileage lower than the current one with the same message and changes nothing; rejects the stale reading with the rollback message and writes no baseline<br>`unit/application/vehicles/update-vehicle.test.ts`: odometer rollback protection; a concurrent raise between the read and the write<br>`unit/infrastructure/http/technician-handlers.test.ts`: answers 400 with the rollback message for a lower mileage and changes nothing<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 400 when the mileage would go down | `integration/vehicle-repository.test.ts`: refuses a value below the stored one even when the caller read the old value earlier; refuses a stale reading, keeps the higher mileage and writes no baseline | `component/forms/vehicle-form.test.tsx`: shows the odometer rollback message under the mileage field<br>`component/vehicle-health/part-detail-panel.test.tsx`: shows the error message, keeps the form open with the typed value and allows retrying<br>`component/vehicle-health/use-service-recorder.test.tsx`: returns the field message of a 400 and does not refresh<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: shows the server's message and does not refresh when the service is refused | `e2e/vehicles.spec.ts`: mileage cannot decrease; a higher reading is saved | - |
| VEH-10 | Delete with confirmation | `unit/application/vehicles/delete-vehicle.test.ts`: removes the vehicle and its baselines, and it no longer appears in the list<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 204 without a body and removes the vehicle | - | `component/vehicles/delete-vehicle-button.test.tsx`: asks for confirmation before anything is deleted; deletes the vehicle once confirmed and returns to the list | `e2e/vehicles.spec.ts`: deleting asks for confirmation, then removes the vehicle | - |
| VEH-11 | Empty list state | `unit/application/vehicles/list-vehicles.test.ts`: returns an empty list for an owner with no vehicles | - | `component/vehicles/vehicle-list.test.tsx`: shows the empty state with a Register vehicle action when there are no vehicles | `e2e/vehicles.spec.ts`: an owner without vehicles sees the empty state with a register action | - |
| VEH-12 | Cross-owner read denied | `unit/application/vehicles/get-vehicle-health.test.ts`: answers NotFound for another owner's vehicle and for an id that does not exist<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 404 for another owner's vehicle exactly as for one that does not exist | - | - | `e2e/api-security.spec.ts`: VEH-12 and VEH-13 an owner cannot read, edit or delete another owner's vehicle (404) and it stays unchanged | - |
| VEH-13 | Cross-owner modification denied | `unit/application/vehicles/delete-vehicle.test.ts`: answers NotFound for another owner's vehicle and keeps it<br>`unit/application/vehicles/set-baseline.test.ts`: answers NotFound for another owner's vehicle and saves nothing<br>`unit/application/vehicles/update-vehicle.test.ts`: answers NotFound for another owner's vehicle and leaves it unchanged; checks ownership before validating, so invalid input cannot probe for existence<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 404 for another owner's vehicle and leaves it unchanged; answers 404 for another owner's vehicle and keeps it; answers 404 for another owner's vehicle | - | - | `e2e/api-security.spec.ts`: VEH-12 and VEH-13 an owner cannot read, edit or delete another owner's vehicle (404) and it stays unchanged | - |
| VEH-14 | Technician finds a vehicle by plate | `unit/application/technician/find-vehicle-by-plate.test.ts`: finds the vehicle whatever the case of the typed plate; ignores spaces around the typed plate; reaches a vehicle that belongs to any owner<br>`unit/application/validation/vehicle.test.ts`: normalizes %j to %j<br>`unit/application/vehicles/get-vehicle-health.test.ts`: lets a technician read any vehicle<br>`unit/infrastructure/http/technician-handlers.test.ts`: answers 200 with the vehicle id and plate whatever the case of the typed plate | - | `component/technician/plate-search-form.test.tsx`: searches the typed plate and opens the vehicle's health page | `e2e/technician.spec.ts`: a technician lands on the search page and finds a vehicle by plate in any case | - |
| VEH-15 | Plate not found | `unit/application/technician/find-vehicle-by-plate.test.ts`: answers an unknown plate with NotFound and the message the page shows<br>`unit/infrastructure/http/technician-handlers.test.ts`: answers 404 with the not-found message for an unknown plate | - | `component/technician/plate-search-form.test.tsx`: shows the not-found message and stays on the page | `e2e/technician.spec.ts`: an unknown plate shows that no vehicle was found | - |
| VEH-16 | Technician records a serviced part | `unit/application/technician/record-service.test.ts`: technician records a serviced part<br>`unit/infrastructure/http/technician-handlers.test.ts`: answers 200 with the recomputed health: mileage updated, part green | - | `component/vehicle-health/part-detail-panel.test.tsx`: reports the selected part and the typed mileage<br>`component/vehicle-health/use-service-recorder.test.tsx`: posts the part and mileage to the vehicle's service endpoint, refreshes and reports no error<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: posts the service to the vehicle's endpoint and refreshes the page data | `e2e/technician.spec.ts`: a technician records a serviced part: mileage and baseline update and the part turns green | - |
| VEH-17 | Technician cannot edit or delete | `unit/application/vehicles/delete-vehicle.test.ts`: refuses a technician with Forbidden and keeps the vehicle<br>`unit/application/vehicles/register-vehicle.test.ts`: refuses a technician before reading the input<br>`unit/application/vehicles/update-vehicle.test.ts`: refuses a technician with Forbidden and leaves the vehicle unchanged<br>`unit/infrastructure/http/technician-handlers.test.ts`: technicians still cannot edit or delete<br>`unit/infrastructure/http/vehicle-handlers.test.ts`: answers 403 for a technician and saves nothing; answers 403 for a technician and leaves the vehicle unchanged; answers 403 for a technician and keeps the vehicle; answers 403 to a technician sending %s and leaves the baselines alone | - | `component/pages/role-pages.test.tsx`: forbids a technician on the register page with a real 403; forbids a technician on the edit page with a real 403 | `e2e/api-security.spec.ts`: a technician cannot edit or delete a vehicle or its baselines (403) and owner-only pages answer 403 | - |

## Part health (HLT)

| ID | Scenario | Unit | Integration | Component | E2E | Manual |
|----|----------|------|-------------|-----------|-----|--------|
| HLT-01 | Catalog content | `unit/domain/part-health/catalog.test.ts`: contains exactly the 8 parts with the spec intervals; tracks only the battery by time alone; has unique part ids | - | - | - | - |
| HLT-02 | Km dominates | `unit/domain/part-health/rule-based-estimator.test.ts`: lets km dominate: oil at 40,000 km set 30 days ago, now 44,000 | - | - | - | - |
| HLT-03 | Time dominates | `unit/domain/part-health/rule-based-estimator.test.ts`: lets time dominate: air filter at 44,000 km set 300 days ago, now 45,000 | - | - | - | - |
| HLT-04 | Time-only part | `unit/domain/part-health/rule-based-estimator.test.ts`: tracks the battery by time only: baseline 540 days ago | - | - | - | - |
| HLT-05 | Just serviced | `unit/domain/part-health/rule-based-estimator.test.ts`: reports ratio 0 and green when just serviced | - | - | - | - |
| HLT-06 | Threshold boundaries | `unit/domain/part-health/status.test.ts`: maps ratio %s to %s (lower bounds inclusive) | - | - | - | - |
| HLT-07 | Remaining values | `unit/domain/part-health/rule-based-estimator.test.ts`: reports remaining km and days: oil at 40,000 km set 30 days ago, now 44,000 | - | - | - | - |
| HLT-08 | Overdue values | `unit/domain/part-health/rule-based-estimator.test.ts`: reports overdue km as a negative value: oil at 38,000 km, now 44,000; reports overdue days as a negative value | - | - | - | - |
| HLT-09 | Worst part wins | `unit/application/vehicles/get-vehicle-health.test.ts`: reports the worst part status as the overall status<br>`unit/domain/part-health/status.test.ts`: returns orange for 6 green, 1 yellow and 1 orange parts; ranks red above orange, yellow and green regardless of order; treats an empty list as green | - | - | - | - |
| HLT-10 | Rule-based estimator is the default | `unit/application/vehicles/get-vehicle-health.test.ts`: uses the estimator it is given instead of the default<br>`unit/domain/part-health/rule-based-estimator.test.ts`: returns the rule-based estimator by default; produces results through the HealthEstimator port | - | - | - | - |

## Maintenance schedule (MNT)

| ID | Scenario | Unit | Integration | Component | E2E | Manual |
|----|----------|------|-------------|-----------|-----|--------|
| MNT-01 | Km projection is earlier | `unit/domain/maintenance/schedule.test.ts`: uses the earlier km-based date over the time-based date; time-based due date is baseline + 180 days when km is not projected | - | - | - | - |
| MNT-02 | Zero monthly mileage | `unit/domain/maintenance/schedule.test.ts`: uses only time-based dates when monthly mileage is zero | - | - | - | - |
| MNT-03 | Time-only part | `unit/domain/maintenance/schedule.test.ts`: time-only part has no due mileage and is due baseline + 1,080 days | - | - | - | - |
| MNT-04 | Overdue by mileage | `unit/domain/maintenance/schedule.test.ts`: marks a part overdue when current mileage equals its due mileage; does not mark a part overdue one km before its due mileage; marks overdue by mileage even when the due date is still in the future | - | - | - | - |
| MNT-05 | Overdue by date | `unit/domain/maintenance/schedule.test.ts`: marks a part overdue when its time-based due date was yesterday; marks a part overdue when its due date is today and not when it is tomorrow | - | - | - | - |
| MNT-06 | Earliest part sets the date | `unit/domain/maintenance/schedule.test.ts`: uses the earliest due date and groups parts within 30 days | - | - | - | - |
| MNT-07 | Overdue visit | `unit/domain/maintenance/schedule.test.ts`: flags an overdue visit for today and includes the overdue part; groups parts within 30 days of today, not of the overdue part's date | - | - | - | - |
| MNT-08 | Recalculated after service | `unit/application/technician/record-service.test.ts`: recomputes the next maintenance from the remaining parts and the new baseline; uses the clock's date as today for the new baseline<br>`unit/application/vehicles/get-vehicle-health.test.ts`: recomputes from the stored baselines after a baseline changes (MNT-08)<br>`unit/domain/maintenance/schedule.test.ts`: recomputes from the remaining parts and the new engine oil baseline | - | - | - | - |

## Vehicle health view (VIEW)

| ID | Scenario | Unit | Integration | Component | E2E | Manual |
|----|----------|------|-------------|-----------|-----|--------|
| VIEW-01 | Summary content | - | - | `component/vehicle-health/health-summary.test.tsx`: shows the vehicle details, overall status, next maintenance and the generic-intervals notice; flags overdue next maintenance explicitly<br>`component/vehicle-health/vehicle-health-view.test.tsx`: renders the summary with the generic-intervals notice | `e2e/health-view.spec.ts`: the summary shows the vehicle, its overall status, the next maintenance and the generic-intervals notice; an overdue next maintenance is flagged | - |
| VIEW-02 | All parts listed with text status | `unit/components/part-rows.test.ts`: merges health and dues into one serializable row per catalog part, in catalog order; describes km left, overdue and time-based parts; describes days left and overdue with correct singular forms<br>`unit/components/status-colors-3d.test.ts`: the %s hotspot color matches its --status CSS variable | - | `component/vehicle-health/part-list.test.tsx`: lists all 8 parts in catalog order with name, status text and usage percentage; never relies on color alone: every item pairs the status text with a color swatch; shows remaining km and days and the due date, and Time-based for the battery; flags an overdue part explicitly and only that part<br>`component/vehicle-health/status-colors.test.tsx`: text on the %s status color meets WCAG AA (4.5:1)<br>`component/vehicle-health/vehicle-health-view.test.tsx`: renders all 8 parts in the list | `e2e/health-view.spec.ts`: ${plate} lists 8 parts, each with its name, status as text and usage percentage | - |
| VIEW-03 | Body type selects the model | `unit/components/vehicle-health-models.test.ts`: maps the %s body type to its own model; gives each body type a distinct silhouette; the pickup is longer than the hatchback and the SUV is taller than the sedan | - | `component/vehicle-health/vehicle-3d.test.tsx`: shows the %s model for that body type<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: shows the model for the vehicle's body type when WebGL is available | - | [M-1](manual-tests.md#m-1) |
| VIEW-04 | Clicking a part zone opens details | - | - | `component/vehicle-health/part-detail-panel.test.tsx`: shows the selected part's status, usage, remaining km and days and due date; shows overdue explicitly and Time-based for a time-only part<br>`component/vehicle-health/vehicle-3d.test.tsx`: renders one real button per part, named with the part and its status text; reports the part when its button is clicked; rotates slowly while nothing is selected and pauses once a part is selected<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: clicking a model hotspot opens the part's panel and pauses the rotation | `e2e/health-view.spec.ts`: VIEW-04 and VIEW-05 selecting a part in the list shows its details, and the model highlights it; clicking a part zone on the 3D model opens its details; the rotating model pauses when a part zone is clicked | [M-2](manual-tests.md#m-2), [M-3](manual-tests.md#m-3) |
| VIEW-05 | List and model stay in sync | `unit/components/status-colors-3d.test.ts`: uses the status color and a glow for the selected part only | - | `component/vehicle-health/diagram-2d.test.tsx`: selects a part when its zone is clicked; selects a part from the keyboard with Enter and Space only; highlights only the selected zone<br>`component/vehicle-health/part-list.test.tsx`: marks the selected part with aria-pressed and no other; reports the part id when an item is chosen<br>`component/vehicle-health/vehicle-3d.test.tsx`: marks only the selected part as pressed and highlights it in the scene<br>`component/vehicle-health/vehicle-health-view.test.tsx`: keeps the list, the panel and the diagram zone in sync when selecting from the list; keeps everything in sync when selecting from the diagram<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: selecting a part in the list updates the panel and highlights its hotspot | `e2e/health-view.spec.ts`: VIEW-04 and VIEW-05 selecting a part in the list shows its details, and the model highlights it | [M-4](manual-tests.md#m-4) |
| VIEW-06 | No WebGL | - | - | `component/vehicle-health/diagram-2d.test.tsx`: shows 8 focusable zones named with the part and its status text; colors each zone by the status of its part; is an image-like group with an accessible name<br>`component/vehicle-health/vehicle-health-view.test.tsx`: shows the 2D diagram with 8 zones and no errors when WebGL is unavailable; uses the 2D diagram while WebGL support is still unknown<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: shows the 2D diagram and never loads the model when WebGL is unavailable<br>`component/vehicle-health/web-gl-support.test.tsx`: is true when a WebGL context can be created; is false when the browser gives no WebGL context; is false, not an error, when creating the context throws; reports true in a browser with WebGL; reports false in a browser without WebGL and probes only once | `e2e/health-view.spec.ts`: without WebGL a 2D diagram with 8 colored zones is shown and the page has no errors | [M-6](manual-tests.md#m-6) |
| VIEW-07 | Reduced motion | - | - | `component/vehicle-health/prefers-reduced-motion.test.tsx`: is true when the system prefers reduced motion<br>`component/vehicle-health/vehicle-3d.test.tsx`: does not auto-rotate when the system prefers reduced motion; stops rotating if the preference turns on while the page is open<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: renders the model without auto-rotation when reduced motion is preferred | `e2e/health-view.spec.ts`: with reduced motion the model is shown without auto-rotation | [M-5](manual-tests.md#m-5) |
| VIEW-08 | Technician sees the service action | - | - | `component/vehicle-health/part-detail-panel.test.tsx`: service action<br>`component/vehicle-health/vehicle-health-view.test.tsx`: offers Mark as serviced to a technician, prefilled with the vehicle's mileage, and reports the selected part | `e2e/technician.spec.ts`: a technician sees Mark as serviced for the selected part | - |
| VIEW-09 | Owner does not see the service action | - | - | `component/vehicle-health/part-detail-panel.test.tsx`: never shows Mark as serviced to an owner, even when a callback is given<br>`component/vehicle-health/vehicle-health-view.test.tsx`: never shows Mark as serviced to an owner<br>`component/vehicle-health/vehicle-health-with-model.test.tsx`: offers no action without a service vehicle | `e2e/technician.spec.ts`: an owner does not see Mark as serviced | - |

## Notes

- No end-to-end test, by design: the part health and maintenance rules (HLT, MNT) are pure domain logic proven at the unit layer; AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-11, VEH-05, VEH-06, VEH-07, VIEW-03 are proven below the browser (the unit, integration or component layer, as the matrix shows) and by the manual checks where listed.
- AUTH-11 (lockout expiry) needs 15 minutes of clock time, so it is proven with a controlled clock at the unit layer only.
- VIEW-03 and the visual side of VIEW-04, VIEW-05, VIEW-06 and VIEW-07 (what the model looks like and how it moves) cannot be judged by an assertion; the end-to-end tests check the behavior (selection, pause, fallback, no auto-rotation) and the manual checks cover the appearance.

## Checks that are not tied to a scenario ID

| Check | Test |
|-------|------|
| A foreign or missing `Origin` header on a mutating call is refused with 403 and changes nothing (CSRF defense) | E2E: `e2e/api-security.spec.ts` (origin check); unit: `unit/infrastructure/http/origin-check.test.ts`, `unit/infrastructure/http/handle.test.ts` |
| Wrong-role pages answer a real HTTP 403 (`forbidden()`) | E2E: `e2e/api-security.spec.ts` (AUTH-15, VEH-17); component: `component/forbidden.test.tsx`, `component/pages/role-pages.test.tsx` |
