# Brand and Theme Specification

## Purpose

The TwinES visual identity and theming: design tokens, a light and a dark theme, theme selection (OS default, manual override, return to "follow system"), the logo and icon, and self-hosted typography. Status colors keep their meaning in both themes and every text and UI token pair meets WCAG 2.1 AA. Scenario IDs (`THEME-xx`) are test case identifiers.

Out of scope: any server-side storage of the theme choice, and any change to the status color values.

## Requirements

### Requirement: Design tokens as the single source of color

All colors used by the interface MUST come from a named set of design tokens. The token set MUST cover at least: page and surface backgrounds, text and muted text, borders, the brand accent, the keyboard focus indicator, and the four status colors (Green, Yellow, Orange, Red). Style sheets and components MUST NOT contain hard-coded color literals outside the token definitions and the 3D mirror of those definitions. The tokens that three.js materials and the 2D SVG diagram need MUST have a TypeScript mirror whose values equal the token values of the active theme definitions.

#### Scenario: THEME-01 No hard-coded color literals

- GIVEN the style sheets and components under `twines/src/`
- WHEN a scan looks for hex, `rgb()`, `hsl()` and named color literals
- THEN every match is inside a token definition file or the 3D token mirror
- AND no other file contains a color literal

#### Scenario: THEME-02 Token set is complete in both themes

- GIVEN the light theme and the dark theme definitions
- WHEN their token names are compared
- THEN both define exactly the same token names
- AND no token is empty

#### Scenario: THEME-03 3D mirror matches the CSS tokens

- GIVEN the TypeScript mirror used by the 3D scene and the CSS token definitions
- WHEN the test compares every mirrored token with its CSS value for each theme
- THEN each pair is equal
- AND a mirror entry without a CSS token, or a CSS token marked as mirrored without a mirror entry, fails the test

#### Scenario: THEME-04 Accent does not overlap the status hues

- GIVEN the brand accent token in each theme
- WHEN its hue is compared with the hue of each of the four status colors
- THEN the accent hue differs from every status hue by at least 30 degrees
- AND the accent is never used to express a part status

### Requirement: Light and dark themes

The system MUST provide a light theme and a dark theme from the first release of this change, each defining the complete token set. Every page, including the sign-in and sign-up pages, the vehicle list and forms, the technician page, the vehicle health view and the 2D diagram, MUST be fully readable and operable in both themes. The 3D scene background and materials driven by tokens MUST follow the active theme.

#### Scenario: THEME-05 Light theme renders

- GIVEN the active theme is light
- WHEN any page renders
- THEN the page uses the light token values
- AND the root element reports the light theme

#### Scenario: THEME-06 Dark theme renders

- GIVEN the active theme is dark
- WHEN any page renders
- THEN the page uses the dark token values
- AND the root element reports the dark theme

#### Scenario: THEME-07 The 2D diagram follows the theme

- GIVEN the browser has no WebGL and the 2D diagram is shown
- WHEN the active theme changes from light to dark
- THEN the diagram surfaces, outlines and labels use the dark token values
- AND each zone still shows its status color

#### Scenario: THEME-08 The 3D scene follows the theme

- GIVEN the 3D model is shown
- WHEN the active theme changes from light to dark
- THEN the scene background and token-driven materials use the dark token values
- AND the status colors of the part zones do not change

### Requirement: Theme follows the operating system by default

When the user has made no manual choice, the active theme MUST equal the operating system preference (`prefers-color-scheme`). While the system option is in effect, a change of the operating system preference MUST update the active theme without a reload. If the preference is unavailable, the light theme SHALL apply.

#### Scenario: THEME-09 OS dark, no stored choice

- GIVEN no stored theme choice
- AND the operating system prefers dark
- WHEN a page loads
- THEN the dark theme is active

#### Scenario: THEME-10 OS light, no stored choice

- GIVEN no stored theme choice
- AND the operating system prefers light
- WHEN a page loads
- THEN the light theme is active

#### Scenario: THEME-11 OS preference changes while following the system

- GIVEN the system option is in effect and the light theme is active
- WHEN the operating system preference changes to dark while the page is open
- THEN the dark theme becomes active without a reload

#### Scenario: THEME-12 No OS preference available

- GIVEN no stored choice
- AND the browser exposes no color scheme preference
- WHEN a page loads
- THEN the light theme is active

### Requirement: Manual theme toggle with system, light and dark

The application shell MUST offer a theme control with exactly three options: system, light and dark. The control MUST show which option is in effect, MUST be operable by keyboard, and MUST have an accessible name and an accessible state for each option. Choosing light or dark MUST override the operating system preference. Choosing system MUST remove the override and return to following the operating system. The choice MUST be remembered client-side across reloads and sessions in the same browser. It MUST NOT be written to the database or sent to any application API. If client-side storage is unavailable or holds an invalid value, the system option SHALL apply and the page MUST show no error.

#### Scenario: THEME-13 Toggle offers three options

- GIVEN a signed-in user on any page with the application shell
- WHEN the theme control is opened or inspected
- THEN it offers system, light and dark
- AND the option in effect is marked as such for assistive technology

#### Scenario: THEME-14 Manual choice overrides the OS

- GIVEN the operating system prefers light
- WHEN the user chooses dark
- THEN the dark theme becomes active immediately
- AND an operating system change to light does not change the active theme

#### Scenario: THEME-15 Choice persists across reload

- GIVEN the user chose dark while the operating system prefers light
- WHEN the page is reloaded and when the browser later opens a new tab on the site
- THEN the dark theme is active in both
- AND the theme control shows dark as the option in effect

#### Scenario: THEME-16 Return to follow system

- GIVEN the user chose dark while the operating system prefers light
- WHEN the user chooses system
- THEN the light theme becomes active
- AND the stored override is removed
- AND a later reload follows the operating system preference

#### Scenario: THEME-17 Invalid stored value is ignored

- GIVEN the stored theme value is not one of the accepted values
- WHEN a page loads
- THEN the system option applies and no error is shown or logged to the user

#### Scenario: THEME-18 Storage unavailable

- GIVEN the browser blocks client-side storage
- WHEN the page loads and the user chooses dark
- THEN the dark theme applies for the current page view
- AND the page shows no error

#### Scenario: THEME-19 No server involvement

- GIVEN a user changes the theme option several times
- WHEN the network traffic and the database are inspected
- THEN no application API request carries the theme choice
- AND no database record holds it

#### Scenario: THEME-20 Toggle is keyboard operable

- GIVEN keyboard focus is on the theme control
- WHEN the user changes the option using the keyboard only
- THEN the option changes and the active theme updates
- AND keyboard focus stays on the control

### Requirement: No flash of the wrong theme

The correct theme MUST be applied before the first paint of every page load, so that no frame is shown in a theme different from the one that will be active after hydration. The server-rendered document MUST tolerate the theme attribute being set before hydration without hydration errors.

#### Scenario: THEME-21 Stored dark over OS light, first paint

- GIVEN the stored choice is dark and the operating system prefers light
- WHEN a page is loaded and the theme on the root element is read at the first paint
- THEN the dark theme is already active at the first paint

#### Scenario: THEME-22 OS dark without a stored choice, first paint

- GIVEN no stored choice and the operating system prefers dark
- WHEN a page is loaded and the theme on the root element is read at the first paint
- THEN the dark theme is already active at the first paint

#### Scenario: THEME-23 No hydration error

- GIVEN the stored choice differs from what the server could assume
- WHEN a page loads and hydrates
- THEN the browser console shows no hydration mismatch error
- AND the theme does not change after hydration

### Requirement: Status colors are identical across themes

The four status colors (Green, Yellow, Orange, Red) MUST have the same values in the light theme and in the dark theme, in the CSS tokens, the 3D mirror and the 2D diagram. Status MUST always be conveyed by text as well as color.

#### Scenario: THEME-24 Status color values do not change with the theme

- GIVEN the light and dark token definitions
- WHEN the status color tokens are compared
- THEN each status color has the same value in both themes
- AND the values equal the 3D mirror values

#### Scenario: THEME-25 Status is never color only

- GIVEN a vehicle with parts in all four statuses
- WHEN the vehicle page renders in light and in dark
- THEN every status swatch, zone and hotspot is accompanied by the status text (Green, Yellow, Orange, Red)

### Requirement: WCAG 2.1 AA contrast in both themes

In both themes the system MUST meet WCAG 2.1 AA: text against its background at least 4.5:1 (3:1 for large text), and UI component boundaries, focus indicators and meaningful graphics against their adjacent color at least 3:1. The status text pairs (text on each status color) MUST keep at least 4.5:1. Because the status colors are fixed across themes, a status swatch that falls below 3:1 against a theme surface MUST be surrounded by a themed ring or border token that reaches at least 3:1 against that surface, and the status MUST remain stated as text. If that ring cannot reach 3:1, the status color values MUST NOT be altered by the implementation; the conflict MUST be returned to the product owner for a decision.

#### Scenario: THEME-26 Text pairs meet AA in light

- GIVEN the light theme token pairs for text, muted text, accent text and link text on their backgrounds
- WHEN the contrast ratios are computed
- THEN every normal-size text pair is at least 4.5:1
- AND every large-text pair is at least 3:1

#### Scenario: THEME-27 Text pairs meet AA in dark

- GIVEN the dark theme token pairs for text, muted text, accent text and link text on their backgrounds
- WHEN the contrast ratios are computed
- THEN every normal-size text pair is at least 4.5:1
- AND every large-text pair is at least 3:1

#### Scenario: THEME-28 UI component and focus contrast in both themes

- GIVEN the input border, button boundary and focus indicator tokens of each theme
- WHEN each is measured against the surface it sits on
- THEN each is at least 3:1 in both themes

#### Scenario: THEME-29 Status text pairs keep AA

- GIVEN each status color with its on-status text token
- WHEN the contrast is computed in both themes
- THEN each pair is at least 4.5:1

#### Scenario: THEME-30 Dark mode status swatches have a compliant ring

- GIVEN the dark theme surface and the status colors, including the Red swatch that is below 3:1 against a near-black surface
- WHEN the swatch ring token is measured against the dark surface
- THEN the ring token is at least 3:1 against that surface
- AND every status swatch is rendered with the ring in the dark theme
- AND the status text remains visible beside the swatch

#### Scenario: THEME-31 Ring cannot reach the threshold

- GIVEN a candidate dark surface for which no ring token reaches 3:1 against the surface
- WHEN the token contrast test runs
- THEN the test fails
- AND the status color values stay unchanged until the product owner decides

### Requirement: Logo and application icon

The interface MUST show the TwinES logo in the application shell and on the sign-in and sign-up pages. The logo MUST be an inline SVG component that takes its color from the surrounding text color so that it adapts to both themes, MUST expose an accessible name when it is the only brand text in its container and MUST be hidden from assistive technology when adjacent text already names the product. The application MUST serve an SVG icon as its site icon, legible on both light and dark browser chrome.

#### Scenario: THEME-32 Logo in the shell

- GIVEN a signed-in user on any page
- WHEN the shell renders
- THEN the logo is shown in the shell header
- AND it is also shown on the sign-in and sign-up pages

#### Scenario: THEME-33 Logo adapts to the theme

- GIVEN the logo is rendered
- WHEN the theme changes between light and dark
- THEN the logo color follows the surrounding text color token
- AND it keeps at least 3:1 contrast against its background in both themes

#### Scenario: THEME-34 Logo accessible name

- GIVEN the logo is the only brand element in its container
- WHEN assistive technology reads the page
- THEN the logo is announced as "TwinES"
- AND when the product name is already present as adjacent text, the logo is not announced a second time

#### Scenario: THEME-35 Site icon

- GIVEN the application is opened in a browser
- WHEN the document head and the icon route are requested
- THEN an SVG site icon is declared and served successfully
- AND no request for the previous raster favicon is needed

### Requirement: Self-hosted typography

The typeface MUST be served from the application's own origin. The page MUST NOT request fonts from a third-party host at runtime. Text MUST remain readable with a fallback font while the typeface loads or if it fails to load.

#### Scenario: THEME-36 No third-party font requests

- GIVEN a page is loaded with the network observed
- WHEN all requests complete
- THEN every font file is requested from the application's own origin
- AND no request goes to a third-party font host

#### Scenario: THEME-37 Fallback text while loading

- GIVEN the font file is slow or blocked
- WHEN the page renders
- THEN the text is visible in a fallback font
- AND the layout remains usable
