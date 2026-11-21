# Vehicle 3D Assets Specification

## Purpose

The contract between the vehicle 3D assets and the application: the manifest that maps vehicles to shells and GLB nodes to parts and systems, the order in which a model is resolved, the budgets every committed asset must respect, the rule that no asset carries a logo or badge, the provenance and licence record, and the check that enforces the contract in Node. Scenario IDs (`ASSET-xx`) are test case identifiers.

Part identifiers are the 8 catalog parts: `engine-oil`, `oil-filter`, `air-filter`, `spark-plugs`, `coolant`, `battery`, `tires`, `brake-pads`. Body types are `sedan`, `hatchback`, `suv` and `pickup`.

Out of scope: the visual quality of the shells (signed off by the product owner from viewport screenshots), per-trim, per-year and per-color variants, interior modeling, and any paid asset source.

## Requirements

### Requirement: Asset manifest is the single source of the asset contract

The system MUST have one typed manifest that declares: every shell (an identifier, the asset file, and either a specific match of make and model with a body type, or a generic match by body type), the mapping from GLB node names to part identifiers, every system (an identifier, a visible label, its member part identifiers, its assembly asset, and a focus anchor), and the per-shell transform that places each system assembly on that shell. Resolution, hotspot placement and system membership MUST read only the manifest. The manifest MUST declare exactly 8 shells: one specific and one generic shell for each of the 4 body types. The specific shells MUST be Toyota Corolla (sedan), Honda Fit (hatchback), Hyundai Tucson (suv) and Toyota Hilux (pickup).

#### Scenario: ASSET-01 Manifest declares 8 shells

- GIVEN the manifest
- WHEN its shells are listed
- THEN there are 8 shells
- AND each of the 4 body types has exactly one specific shell and exactly one generic shell
- AND the specific shells are Corolla, Fit, Tucson and Hilux

#### Scenario: ASSET-02 Every part is mapped exactly once

- GIVEN the manifest node-to-part mapping and the part catalog
- WHEN the integrity test runs
- THEN each of the 8 part identifiers is mapped to exactly one node name
- AND no node name maps to an identifier outside the catalog

#### Scenario: ASSET-03 Systems reference only catalog parts

- GIVEN the systems declared in the manifest
- WHEN the integrity test runs
- THEN every system member is a catalog part identifier
- AND no part belongs to more than one system
- AND every system declares an assembly asset, a label and a focus anchor

#### Scenario: ASSET-04 Initial systems

- GIVEN the manifest
- WHEN its systems are listed
- THEN `engine-bay` contains `engine-oil`, `oil-filter`, `air-filter`, `spark-plugs`, `coolant` and `battery`
- AND `wheels` contains `tires` and `brake-pads`

#### Scenario: ASSET-05 Every shell has a transform for every system

- GIVEN the manifest
- WHEN the integrity test runs
- THEN each shell declares a placement transform (position, rotation and scale) for each system assembly
- AND a missing transform fails the test

#### Scenario: ASSET-06 Manifest points to existing files

- GIVEN the manifest
- WHEN the integrity test runs
- THEN every shell file and assembly file it names exists in the served models folder
- AND a missing file fails the test

### Requirement: Systems are data, not code

Adding a system MUST require only manifest data (the system entry, its members, its assembly and its per-shell transforms) and the matching asset. It MUST NOT require changes to the interaction, state or rendering code of the drill-down.

#### Scenario: ASSET-07 Third system from a fixture

- GIVEN a test fixture manifest with a third system `fixture-system` containing two catalog parts
- WHEN the vehicle view is rendered with the fixture manifest
- THEN the view offers a hotspot for `fixture-system`
- AND activating it focuses the system and exposes its two part hotspots
- AND the attention indicator and the selected-part marker work for it
- AND no production interaction code was changed for the fixture

### Requirement: Model resolution order

The system MUST resolve the model to show for a vehicle in this order: (1) the specific shell whose make and model match the vehicle's make and model and whose body type matches; (2) otherwise the generic shell of the vehicle's body type; (3) otherwise, or when a required GLB file fails to load, the primitive model for the body type; and, independently of this order, (4) the 2D SVG diagram when WebGL is unavailable. Matching of make and model MUST ignore letter case, leading and trailing whitespace, and repeated internal whitespace, because both fields are free text. A specific shell MUST NOT be used for a vehicle that matches only the make, only the model, or only the body type.

#### Scenario: ASSET-08 Specific shell for an exact match

- GIVEN a vehicle Toyota Corolla with body type sedan
- WHEN the resolver runs
- THEN the Corolla shell is selected

#### Scenario: ASSET-09 Matching ignores case and whitespace

- GIVEN a vehicle with make " toyota " and model "COROLLA  " with body type sedan
- WHEN the resolver runs
- THEN the Corolla shell is selected

#### Scenario: ASSET-10 Seeded vehicles with a specific shell

- GIVEN the seeded vehicles Toyota Corolla, Honda Fit, Hyundai Tucson and Toyota Hilux
- WHEN the resolver runs for each
- THEN each gets its own specific shell

#### Scenario: ASSET-11 Seeded vehicles without a specific shell

- GIVEN the seeded vehicles Nissan Sentra (sedan) and Kia Rio (hatchback)
- WHEN the resolver runs for each
- THEN Sentra gets the generic sedan shell
- AND Rio gets the generic hatchback shell

#### Scenario: ASSET-12 Same make, different model

- GIVEN a vehicle Toyota Camry with body type sedan
- WHEN the resolver runs
- THEN the generic sedan shell is selected, not the Corolla shell

#### Scenario: ASSET-13 Same model text, different body type

- GIVEN a vehicle Honda Fit with body type suv
- WHEN the resolver runs
- THEN the generic suv shell is selected, not the Honda Fit shell

#### Scenario: ASSET-14 Unknown vehicle by body type

- GIVEN a vehicle of an unlisted make and model with body type pickup
- WHEN the resolver runs
- THEN the generic pickup shell is selected

#### Scenario: ASSET-15 Shell file fails to load

- GIVEN the resolved shell request fails (for example the request is aborted)
- WHEN the vehicle page renders with WebGL available
- THEN the primitive model for the body type is rendered
- AND the page shows no error

#### Scenario: ASSET-16 Assembly file fails to load

- GIVEN the shell loads but a system assembly request fails
- WHEN the vehicle page renders with WebGL available
- THEN the primitive model for the body type is rendered
- AND the page shows no error

#### Scenario: ASSET-17 No WebGL ignores the manifest

- GIVEN a browser without WebGL
- WHEN the vehicle page renders
- THEN the 2D diagram is rendered
- AND no GLB file is requested

#### Scenario: ASSET-18 Emptied manifest

- GIVEN a manifest with no shell entries
- WHEN the vehicle page renders with WebGL available
- THEN the primitive model for the body type is rendered for every vehicle

### Requirement: GLB node contract

Each committed shell GLB MUST contain a shell root node and the system anchor nodes the manifest declares for it, with the exact names the manifest expects. Each committed assembly GLB MUST contain one named node per member part, matching the manifest mapping. Node names MUST be unique within a file and MUST NOT carry import or export suffixes (for example `.001`). Every part node MUST be individually addressable so it can be highlighted and selected on its own.

#### Scenario: ASSET-19 Engine-bay assembly nodes

- GIVEN the engine-bay assembly GLB
- WHEN its node names are read
- THEN it contains exactly the 6 part nodes mapped to `engine-oil`, `oil-filter`, `air-filter`, `spark-plugs`, `coolant` and `battery`

#### Scenario: ASSET-20 Wheel and brake assembly nodes

- GIVEN the wheel and brake assembly GLB
- WHEN its node names are read
- THEN it contains the part nodes mapped to `tires` and `brake-pads`

#### Scenario: ASSET-21 Shell nodes

- GIVEN a shell GLB
- WHEN its node names are read
- THEN it contains the shell root node and the system anchor nodes the manifest declares for it
- AND the shell is a single fadeable object (one root)

#### Scenario: ASSET-22 Missing node fails the check

- GIVEN a GLB that lacks a node the manifest expects
- WHEN the contract check runs
- THEN the check fails and names the file and the missing node

#### Scenario: ASSET-23 Unexpected or renamed node fails the check

- GIVEN a GLB with an unexpected node, a duplicated node name, or a node named with a `.001` style suffix
- WHEN the contract check runs
- THEN the check fails and names the file and the offending node

### Requirement: Asset budgets

Every committed shell GLB MUST NOT exceed 100,000 triangles and MUST NOT exceed 2.5 MB. Every committed system assembly GLB MUST NOT exceed 1 MB. Committed GLBs MUST use only glTF extensions that the locally served runtime decoder supports. The budgets MUST be enforced by the contract check so that a regression fails the test run.

#### Scenario: ASSET-24 Shell within budget

- GIVEN a shell GLB with 80,000 triangles and a size of 2.0 MB
- WHEN the contract check runs
- THEN the shell passes the budget rules

#### Scenario: ASSET-25 Shell over the triangle budget

- GIVEN a shell GLB with 100,001 triangles
- WHEN the contract check runs
- THEN the check fails and reports the triangle count and the limit

#### Scenario: ASSET-26 Shell over the size budget

- GIVEN a shell GLB larger than 2.5 MB
- WHEN the contract check runs
- THEN the check fails and reports the size and the limit

#### Scenario: ASSET-27 Assembly over the size budget

- GIVEN an assembly GLB larger than 1 MB
- WHEN the contract check runs
- THEN the check fails and reports the size and the limit

#### Scenario: ASSET-28 Unsupported extension

- GIVEN a GLB that uses a glTF extension the runtime decoder does not support
- WHEN the contract check runs
- THEN the check fails and names the extension

### Requirement: No logos, badges or brand names on assets

No shell or assembly asset MUST carry a manufacturer logo, badge, emblem or brand name, as geometry, texture or text. Node, mesh, material and texture names inside the GLBs MUST NOT contain a manufacturer or model name. Shells MUST be stylized interpretations of the real vehicles. The provenance record of each asset MUST declare that it contains no logos, badges or brand names.

#### Scenario: ASSET-29 Names contain no brand

- GIVEN every committed GLB
- WHEN the contract check scans node, mesh, material and texture names for the make and model names in the manifest and a list of common manufacturer names
- THEN no name contains a match
- AND a match fails the check and names the file and the name

#### Scenario: ASSET-30 No embedded images

- GIVEN every committed GLB
- WHEN the contract check lists its textures
- THEN a texture or image is accepted only if the provenance record lists it with its source and licence
- AND an unlisted texture fails the check

#### Scenario: ASSET-31 Declaration present

- GIVEN the provenance record of an asset
- WHEN the contract check reads it
- THEN the no-logos declaration is present
- AND a record without the declaration fails the check

### Requirement: Provenance and licence record

Every committed GLB, and any committed third-party file used to produce one, MUST have a provenance record stating: its origin (the committed generator and the preset with their versions, or a third-party source with author and URL), the licence, the tool and version used to produce it (including the Blender version), the production date, and the no-logos declaration. Third-party material MUST be CC0 or an equally permissive licence. No asset MAY originate from a paid service. A GLB without a record, or a record without a GLB, MUST fail the contract check.

#### Scenario: ASSET-32 Every GLB has a complete record

- GIVEN the committed GLBs and the provenance record
- WHEN the contract check runs
- THEN each GLB has an entry with origin, licence, tool and version, date and the no-logos declaration

#### Scenario: ASSET-33 Orphan record or missing record

- GIVEN a GLB without an entry, or an entry naming a GLB that does not exist
- WHEN the contract check runs
- THEN the check fails and names the file or the entry

#### Scenario: ASSET-34 Licence is permissive and free

- GIVEN an entry whose origin is third-party
- WHEN the contract check reads its licence
- THEN the licence is CC0 or an equally permissive licence on an allow-list
- AND an entry with another licence, or marked as originating from a paid service, fails the check

### Requirement: Reproducible assets

All 8 shells and both assemblies MUST be reproducible from the committed generator and the committed presets, run in the documented Blender version with or without the Blender MCP. Each shell in the manifest MUST have exactly one committed preset. The provenance record of a generated asset MUST name its preset and generator version. Raw exports MUST NOT be committed; only the optimized GLBs are.

#### Scenario: ASSET-35 One preset per shell

- GIVEN the manifest shells and the committed presets
- WHEN the integrity test runs
- THEN each shell has exactly one preset
- AND no preset exists for a shell that is not in the manifest

#### Scenario: ASSET-36 Regeneration satisfies the contract

- GIVEN a clean checkout and the documented Blender version
- WHEN the generator is run with the committed presets using the documented command
- THEN the produced and optimized GLBs pass the contract check

#### Scenario: ASSET-37 Raw exports are not committed

- GIVEN the repository
- WHEN the tracked files under the raw export folder are listed
- THEN none are tracked

### Requirement: Locally served assets and decoder

The GLB files and the geometry decoder they need MUST be served from the application's own origin. The vehicle view MUST NOT request any model, decoder or texture from a third-party host at runtime.

#### Scenario: ASSET-38 No third-party asset requests

- GIVEN the vehicle page loads with WebGL available and the network observed
- WHEN all requests complete
- THEN every model and decoder request goes to the application's own origin

### Requirement: Contract check runnable in Node

The asset contract check MUST run under Node without a browser, WebGL or Blender, MUST be part of the standard test run, and MUST read the committed files. It MUST evaluate every rule of this capability (node names, triangle count, size, extensions, names, provenance, manifest integrity) and report all violations in one run, each with the file and the rule. It MUST exit with a non-zero status, or fail the test, when any rule is violated.

#### Scenario: ASSET-39 Clean repository passes

- GIVEN the committed manifest, GLBs and provenance record
- WHEN the contract check runs in Node
- THEN it passes and reports the files it checked

#### Scenario: ASSET-40 All violations reported together

- GIVEN a fixture folder with an oversized GLB and another GLB with a missing node
- WHEN the contract check runs against it
- THEN the check fails
- AND the report lists both violations, each with its file and rule

#### Scenario: ASSET-41 Runs in the standard test run

- GIVEN the project test command
- WHEN it runs on a machine without Blender and without a graphics context
- THEN the contract check executes as part of it
