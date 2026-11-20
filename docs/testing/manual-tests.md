# Manual tests

Checks that an automated assertion cannot judge: how the 3D model looks and moves. The end-to-end suite already proves the behavior (selection, rotation pause, 2D fallback, no auto-rotation under reduced motion); these checks cover what a person sees. Each check names the scenario it supports in [traceability.md](traceability.md).

## Setup

1. Start the app with demo data: `npm run db:seed` then `npm run dev` from `twines/` (see the root `README.md`).
2. Sign in as `owner.one@twines.test` (password: `SEED_OWNER_PASSWORD` from your `.env`).
3. Use a browser with WebGL (any current desktop browser) unless the check says otherwise.

The demo vehicles of this owner, by body type: `TWN-GRN` sedan, `TWN-YLW` hatchback, `TWN-ORG` SUV, `TWN-RED` pickup, `TWN-OVR` sedan.

Record for each check: date, browser and version, pass or fail, and a note when it fails.

## Checks

<a id="m-1"></a>
### M-1 Body type selects the model (VIEW-03)

1. Open the health page of `TWN-GRN`, `TWN-YLW`, `TWN-ORG` and `TWN-RED` in turn.
2. Expected: each page shows a 3D model with a different silhouette that matches its body type. The pickup is visibly longer than the hatchback and the SUV is taller than the sedan.

<a id="m-2"></a>
### M-2 The model rotates slowly (VIEW-04, precondition)

1. Open `TWN-ORG` and wait a few seconds without touching anything.
2. Expected: the model turns slowly around its vertical axis (a turn takes about a minute) and the part markers move with it, each colored by its status.

<a id="m-3"></a>
### M-3 Clicking a part zone pauses rotation and opens the details (VIEW-04)

1. While the model rotates, click a colored marker, for example the one for brake pads. A marker is a moving target: click when it passes, or press Tab until a marker is focused and press Enter.
2. Expected: the rotation eases to a stop within about a second and stays stopped. The panel shows the part name, its status as text (Green, Yellow, Orange or Red), the usage percentage, the remaining kilometers and days (or how overdue it is) and the due date.

<a id="m-4"></a>
### M-4 The list and the model stay in sync (VIEW-05)

1. With brake pads selected, pick Engine oil in the parts list.
2. Expected: the panel now shows engine oil, the engine oil marker is highlighted on the model (larger and glowing) and the brake pads marker is back to normal. Clicking a marker on the model likewise marks that part in the list.

<a id="m-5"></a>
### M-5 Reduced motion (VIEW-07)

1. Turn on the system setting that reduces motion (Windows: Settings, Accessibility, Visual effects, Animation effects off; macOS: Accessibility, Display, Reduce motion), or in the browser developer tools emulate `prefers-reduced-motion: reduce` (Rendering tab).
2. Open `TWN-ORG`.
3. Expected: the model is shown and does not rotate. Turning the preference on while the page is open also stops the rotation.

<a id="m-6"></a>
### M-6 WebGL off shows the 2D diagram (VIEW-06)

1. Disable WebGL: in Chrome or Edge turn off hardware acceleration in settings and restart, or start the browser with `--disable-3d-apis`; in Firefox set `webgl.disabled` to `true` in `about:config`.
2. Open `TWN-ORG`.
3. Expected: a 2D side view of a vehicle appears instead of the 3D model, with eight colored zones (six engine-bay parts, tires, brake pads). Each zone can be clicked or focused and activated with Enter or Space, and opens the same panel. No error appears on the page or in the browser console.

## Usability observations

Observed while building and testing the MVP; none is a defect against the specifications.

- Engine-bay parts cluster in the 3D view. Engine oil, oil filter, air filter, spark plugs, coolant and battery sit close together under the hood, so their markers overlap or are hard to hit individually while the model turns. Use the parts list or the Tab key to reach them; the 2D diagram lays them out as separate tiles.
- A vehicle registered without baselines shows every part red. By specification the default baseline is mileage 0 on the purchase date (the conservative assumption that it was never serviced), so a used vehicle looks overdue until the owner enters the real last services in the Service baselines section of the edit page.
- Leaving the body type unselected on the registration form reports "Body type must be sedan, hatchback, suv or pickup" instead of a "required" message; the message is correct but could be friendlier.
- The access denied page (HTTP 403 for a wrong-role page) has no app header, so there is no sign-out button on it; the "Back to start" link leads to the user's own start page.

## Task-based usability sessions

Ask a person who has not seen the app to do each task without help, and note the time taken, the errors made and any hesitation.

| Task | Start | Done when |
|------|-------|-----------|
| Create an account and register a first vehicle | Sign-up page | The vehicle appears in the list |
| Find out which part needs attention first | A vehicle page (for example `TWN-RED`) | The person names the part and says why |
| Read the next recommended maintenance | A vehicle page | The person states the date and the parts |
| Record a serviced part as a technician | Technician search page | The part shows green and the mileage is updated |
