# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-06-22

### Added

- Expand the bet graphic picker with new icons spanning AI, commerce, and nature themes

### Fixed

- Prevent a layout shift on first load where the footer briefly appeared under the header before the page content rendered

## [1.4.2] - 2026-06-22

### Fixed

- Show the dropdown menu on the app background in dark mode, and ensure menus, popovers, and other floating surfaces adopt the dark theme palette

## [1.4.1] - 2026-06-21

### Changed

- Center the content within each of the four sections in the dashboard summary card
- Default the home dashboard "Sort by" control to bet title

### Fixed

- Match the dropdown menu and other floating surfaces to the dark theme palette instead of an off-tone slate background

## [1.4.0] - 2026-06-21

### Added

- Add a "Sort by" control to the home dashboard for ordering open bets by last modified date, resolution date, brewskis at stake, or bet title

### Changed

- Condense the dashboard summary stats into a single compact card showing your standing, active bets, and the brewskis you could still win or lose, each with an explanatory tooltip

## [1.3.4] - 2026-06-21

### Changed

- Widen dashboard cards to at least 300px and tighten their outcome spacing
- Order each dashboard card's outcomes from the biggest win down to the biggest loss
- Write the opponent label as "vs." everywhere
- When reviewing a proposed graphic change, highlight it and cross out the old graphic

### Fixed

- Show an opponent's current Clerk profile photo for their avatar instead of a stale cached image
- Wrap the status badges on the bet view instead of squeezing the opponent's name onto a sliver
- Vertically center the status badge on dashboard cards

## [1.3.3] - 2026-06-20

### Changed

- Always display a bet's agreed terms, never an unaccepted proposed change, on the bets list, dashboard cards, and bet view
- Lay out the top of dashboard cards and the bet view with the graphic beside the title and the opponent next to the status badge
- Shorten dashboard card stake labels to "Win" and "Lose"
- Mark voided bets more clearly: a faded diagonal strike with a VOID stamp on the standings card (now clickable through to the bet), and a strike through each outcome on a voided bet's view

### Fixed

- Let the player who proposed a change open it to edit or withdraw from the bet view and the bets list, instead of being stuck on a waiting message
- Show an opponent's avatar set directly in Clerk instead of falling back to their initials

## [1.3.2] - 2026-06-20

### Added

- Show voided bets in the standings tab, struck through like a crossed-out note, so a board with only voided settlements is no longer empty
- Let whoever proposed a bet change review it read-only and then edit or withdraw it while it waits for the other player

### Changed

- Present the opponent the same way everywhere ("vs name" with a small avatar) across the bet view, dashboard cards, and edit header
- Remove the reserved empty footer space on dashboard cards that have nothing to flag

### Fixed

- Keep a bet's agreed terms on the dashboard until a proposed change is accepted, instead of revealing the unapproved edit
- Display a friend's Clerk profile photo when they set it outside the app, instead of falling back to their initials

## [1.3.1] - 2026-06-20

### Changed

- Shrink the opponent avatar shown beside the "vs" name on bet cards and the edit header
- Rename the dashboard card "Your turn" flag to "Awaiting your review"

### Fixed

- Show the full bet title on dashboard cards instead of clipping it
- Lay out dashboard cards as a masonry grid so a bet with many outcomes no longer stretches the other cards in its row
- Show each outcome's full text on dashboard cards instead of truncating it

## [1.3.0] - 2026-06-20

### Added

- Review proposed changes to a bet beside the current terms in a single card, with only the changed fields highlighted and the option to counter-propose

### Changed

- Always label the stake sliders YOU and THEM instead of the opponent's first name
- Show the opponent's avatar beside their name in the edit bet header
- List each bet's outcomes with your win or owe stake on the home dashboard cards
- Streamline the home dashboard cards with a single-line "vs" opponent row and no gold highlight border, leaving just the hover lift

### Fixed

- Correct reversed bet outcomes so the bet view, standings, and home dashboard agree with the edit form on who wins and who owes beers
- Resolve all known dependency security advisories

## [1.2.1] - 2026-06-13

### Changed

- Show the opponent on a bet card and the bet view as a clearly labelled avatar and name instead of the previous cramped "vs" layout
- Make text links across the app share one consistent style that underlines on hover

### Fixed

- Serve user avatars from the app's own storage so a friend's photo loads reliably everywhere instead of sometimes showing a blank grey circle
- Match the remove-friend trash icon to the size of the other action icons

## [1.2.0] - 2026-06-13

### Added

- Add a home dashboard that greets you by name and surfaces your running beer standing, active bet count, and the bets needing your attention above a grid of bet cards
- Add an optional resolution date when creating or editing a bet, after which the bet is flagged as awaiting its outcome until you settle it
- Give each bet a streamlined, elegant view page in place of the old read-only form, with the opponent, stakes, and result laid out clearly

### Changed

- Name the opponent throughout a bet: the view and edit pages, the stake sliders, and the dashboard cards now show who the bet is against instead of a generic label
- Load the bets list and dashboard from already-fetched data so they appear instantly after logging in and refresh in the background
- Keep the active tab on the Bets and Friends pages in the URL so refreshing returns you to the same tab, and add a "Find a friend" shortcut on the Friends empty state that jumps straight to the Find Friends tab
- Left-align bet titles in the bets list so they line up regardless of each graphic's width

### Fixed

- Show a friend's initials instead of a blank grey circle when they have no profile photo
- Resolve all known dependency security advisories

## [1.1.0] - 2026-06-01

### Added

- Expand bet graphics well beyond the stock icons: pick from letters, numbers, emojis, and country flags in a searchable, scrollable picker
- Reject proposed changes to a bet to roll it back to the last agreed terms, now available on bets that are not yet active as well as active ones
- Edit a bet straight from its view page
- Prompt before navigating away from a bet you are creating or editing while it has unsaved changes

### Changed

- Show each bet's graphic next to its name across the app, including the bets list and standings
- Make the bet description optional
- Widen the outcome name fields in the bet form to full width, with each stake slider on its own full-width row beneath
- Replace the page loading spinners on the bets, friends, account, and bet pages with skeleton placeholders that mirror the final layout

### Fixed

- Resolve a dark-mode colour clash where the "changes pending" tag was hard to read over a hovered bet row, and soften row and button hover states so they lift more subtly
- Ensure tooltips always contrast with the surface behind them in both light and dark mode

## [1.0.0] - 2026-05-31

### Added

- Build out the full bet lifecycle: create a bet and pass it back and forth with edits until a friend accepts it, then either side proposes the final result (or a void) for the other to approve before the bet settles
- Add a Standings tab to the Bets page that tallies settled bets into a per-friend beer balance, shown as a chart with a breakdown of the bets behind each total
- Keep the Bets page live so new bets and a friend's changes (and the pending-action badge) appear automatically without a manual refresh

### Changed

- Surface bet state as clear tags (active, changes pending, settled) on both the Bets list and the bet view
- Make each bet row clickable to open a read-only view, add quick edit and delete actions, and label the two sides of every outcome simply as "You" and "Them"
- Show a single consistent loading spinner with a contextual label (for example "Loading bets...") in place of the mix of spinners and plain "Loading..." text
- Reflect Friends page actions instantly and roll them back automatically if the server rejects them

### Fixed

- Make account deletion resilient so an interrupted deletion can no longer leave an account in a half-removed state
- Improve the contrast of status tags in dark mode so they stay legible
- Match the light-mode browser theme colour and boot background to the app background so the page no longer flashes a faint colour seam before it loads
- Strengthen request validation and access controls across the backend API, and resolve all known dependency security advisories

## [0.30.0] - 2026-05-30

### Added

- Add a sun/moon theme toggle to the header on the logged-out screens so visitors can switch between light and dark mode before logging in or creating an account
- Provide a "Return to login" link at the bottom of the Privacy Policy and Terms of Service pages for logged-out visitors

### Changed

- Soften the dark-mode background so it no longer reads as pitch black, lightening the header and footer slightly to keep them distinct from the page
- Tone down the hover highlight on ghost buttons in dark mode so it no longer stands out more than it does in light mode

## [0.29.0] - 2026-05-28

### Changed

- Switch the primary button colour from a pale pastel blue to a deeper mid-tone blue (with white text) so it reads as a confident call-to-action against the surrounding surface and gives selected dropdown options, "today" markers, and sorted column headers enough contrast to be readable on white. Same swap applies in dark mode.
- Soften the off-state outline on the dark-mode toggle switch so it no longer reads as a heavy ring around the off pill.

## [0.28.0] - 2026-05-25

### Changed

- Reshape the Friends page action flow: every button (Add friend, Accept, Decline, Cancel sent) now shows an immediate per-row spinner and swaps to its post-action state the moment the server commits, instead of leaving the row idle through the request roundtrip. Sending a friend request no longer flickers the search results list out behind a "Searching…" state.

## [0.27.0] - 2026-05-24

### Added

- Ship a light/dark theme with a "Dark mode" toggle in the user menu (both the desktop popover and the mobile drawer). The first visit follows the OS preference; the user's explicit choice then persists across reloads, and an inline pre-paint script applies the active palette before Angular boots so neither the boot spinner nor the page background flashes the wrong colour on refresh.

### Changed

- Use the bottle icon for the four empty-state placeholders on the Bets page
- Drop the redundant "Create a bet" button from the empty Bets table; the top-bar button is the single call to action
- Restrict Find Friends search to first / last name only — email is no longer searchable from the user-facing flow
- Lighten and desaturate the light-mode app background so it reads closer to the white of the surrounding header and cards

### Fixed

- Stop the "Failed to load …" toasts from appearing for users who just created their account, by ensuring the local user record exists on first authenticated request regardless of webhook timing

## [0.26.0] - 2026-05-23

### Added

- Surface incoming friend requests without a manual refresh by polling the count every 30s while the tab is visible and refreshing immediately when the tab regains focus
- Preload every lazy route once the app boots so navigating to Friends, Bets, or Account no longer waits on a fresh chunk download

### Changed

- Restyle the header notification badges as circular pins in the secondary brand colour with a white border so they read as distinct dots against the link rather than wide red pills, widening only when the count reaches double digits
- Collapse the three separate Friends-tab fetches into a single `/friends/overview` request so the page renders after one round trip instead of three

### Fixed

- Self-host the Righteous brand font so the "brewski bets" header text renders consistently in Firefox (where the Google Fonts dependency could be blocked or weight-matched away)

## [0.25.0] - 2026-05-21

### Added

- Adopt the shared `ea-empty-state` block for the bets list and the Friends, Requests, and Find tabs so empty screens share consistent typography, iconography, and call-to-action buttons across the app

### Changed

- Tighten the bet form character limits to 50 on the title, 300 on the description, 50 on each outcome, and 30 on the icon filter
- Constrain the description field between a 40px minimum and 200px maximum height so the form stays compact while still matching a regular input as the floor
- Enforce a 100px minimum width on each outcome's brewski slider so it stays usable as the card narrows
- Hide the COLOUR section in the icon picker when no icons match the active filter
- Drop the 0 tick under the brewski slider so only the 1-6 marks on either side remain
- Turn the brewski slider bar and thumb red when the row has a validation error
- Show the icon's title-case name in an `ea-tooltip` on hover instead of the raw slug in a native browser title
- Pull the trash icon outside the bordered outcome card on narrow screens so it sits flush against the wrapped description and slider
- Right-justify the icon preview's edit button and the outcome row trash buttons so they line up vertically at the form's right edge
- Dim the empty-state title to secondary text, drop its bold weight, and lighten the description and icon further so they read as supporting content
- Show an alert icon before every form error message (including the brewski slider) and align the message font size across input fields

### Fixed

- Remove extra vertical padding from the "No icons match that filter" message

## [0.24.0] - 2026-05-21

### Changed

- Rework the bet form icon picker: trim the colour palette to 8 swatches with tighter 4px spacing, require explicit confirmation via a Set / Update icon button (prefixed with a checkmark), and collapse the picker to a 52×52 preview tile with an edit shortcut once the icon is set
- Make the bet icon a required field and enforce character limits of 60 on the title, 500 on the description, and 60 on each outcome description
- Cap each bet at 5 outcomes
- Tighten the icon-picker tiles from 40px to 36px and align the slider, YOU / THEM labels, and tick marks with the outcome description input and the slider's snap positions
- Add an "e.g. Poland wins" placeholder to outcome inputs and rename the outcome validation message to "Outcome description is required"
- Show the trash icon on every outcome row except when only one remains
- Replace the disabled "Bet against" dropdown with an inline 16px "Find a friend" link beside the field label when the user has no friends yet
- Bump the Set icon, Add outcome, and Submit for review buttons to 16px text, and uppercase the Submit for review label
- Enlarge the header hamburger and close icons to 24px inside the existing 40px button

### Fixed

- Stop the bet-form card from overflowing the viewport on narrow screens
- Only show "At least one brewski must be bet" once both the slider and the outcome input have been touched, instead of flashing during drag


## [0.23.0] - 2026-05-20

### Added

- Replace the 10 stock bet images with a filterable, single-row scrollable picker of 57 object icons backed by the new tag metadata in `@eagami/ui` 1.4.0, with a search-icon prefix on the filter input
- Introduce a 12-swatch color picker that tints the chosen bet icon
- Surface inline "required" errors on the Title, Description, Bet against, and outcome name fields as soon as a user blurs them empty, and disable submit buttons until every required field is valid
- Show a "Find a friend" link to the Friends page (Find tab pre-selected) when the user has no friends yet, and disable the Bet against dropdown in that state

### Changed

- Rename "result" to "outcome" throughout the bet form, start new bets with a single outcome row, and only show the remove icon on rows that are not the last
- Combine the brewski count and "who loses" controls into a single signed slider (−6 to +6) labelled YOU / THEM with positive-only notches below for every position, and require at least one brewski per outcome
- Replace the "Remove" outcome button with a red trash icon button, tooltip, and small-viewport layout that vertically centres the icon next to the stacked input and slider
- Prefix the "Add outcome" button with a plus icon and bump form-field labels to 16px
- Reorganise the edit-bet action buttons into a clearer hierarchy: a primary Accept, a secondary Send back with edits, and smaller Propose void and Delete bet buttons beneath
- Honour a `?tab=` query parameter on the Friends page so external links can deep-link into Friends, Requests, or Find

### Fixed

- Show the loading spinner only on the button being actioned instead of on every action button at once
- Stop tall routed pages from crashing through the footer and have the footer track actual content height again, with the bet form contents no longer overflowing the card on narrow viewports


## [0.22.0] - 2026-05-19

### Added

- Show a superscript badge on the Friends nav link when there are incoming friend requests, matching the Bets badge

### Changed

- Remember the active tab on the Friends page across refreshes
- Vary the bets table empty-state message by status filter (All / Pending / Active / Completed) instead of always suggesting to create a first bet
- Move the Bets notification badge in the header nav to a superscript position rather than inline with the link text
- Remove the redundant "Bets awaiting your approval" section from the avatar menu, since the nav badge already surfaces pending counts
- Anchor the footer below the viewport so it is only reachable by scrolling down past the page content


## [0.21.0] - 2026-05-18

### Fixed

- Wire up the "Create a bet" button on the bets page so it navigates to the new-bet form
- Run database migrations automatically as part of the backend production deploy, resolving 500 errors on the bets and friends endpoints caused by an un-applied schema migration
- Recover the Friends page loading state when a request fails, so the page no longer hangs on a skeleton and surfaces an error toast instead

### Changed

- Return a structured JSON error body from unhandled backend exceptions and log them, so 500 responses are diagnosable instead of opaque


## [0.20.0] - 2026-05-17

### Added

- Add a "Delete bet" action on the edit-bet page, guarded by a confirmation dialog
- Surface bets awaiting your approval directly in the avatar menu, with an "Approve all" shortcut, per-bet quick links, and a count badge next to the avatar so it is visible from any page

### Changed

- Upgrade `@eagami/ui` to 1.3.0, migrating templates to the new slot-based card content, `errorMsg` form-field input, and past-tense event outputs
- Bump Angular to 21.2.13, TypeScript to 6.0.3, and refresh remaining frontend and backend dependencies to their latest versions

### Fixed

- Resolve all known dependency vulnerabilities reported by `pnpm audit` across both packages


## [0.19.0] - 2026-04-22

### Added

- Add a translucent effect to app header when content is scrolled behind it
- Add a boot spinner that appears while the app initializes
- Display the logged-in user's email on the account page
- Replace the "Loading..." placeholder text on the account, bets, and friends pages with skeleton loaders that mirror the final layout

### Fixed

- Anchor the footer to the bottom of the viewport on short pages and prevent it from rendering between page content


## [0.18.0] - 2026-04-21

### Added

- Make the header translucent with a frosted-glass blur when the main content is scrolled
- Give header navigation links a button-style grey hover matching the log in button
- Show the log in button in the header on the create account and forgot password pages

### Changed

- Refresh the app with a cream background palette, replacing the dark navy
- Restyle the home page background with a subtle warm cream gradient
- Refactor privacy policy and terms of service pages to a full-height natural scroll layout with deep-link anchors, dropping the scrollable card
- Darken the footer version link for better legibility


## [0.17.0] - 2026-04-19

### Added

- Add footer with copyright, version link, privacy policy and terms of service links, and eagami wordmark
- Add responsive hamburger menu for mobile viewports

### Changed

- Move pending bets notification from header dropdown to inline badge next to "Bets" nav link
- Remove redundant privacy policy and terms of service links from login and create account cards
- Upgrade `@eagami/ui` to 0.10.1

### Fixed

- Fix frontend preview deployment failing when PR does not yet exist at push time

## [0.16.0] - 2026-04-11

### Added

- Build out friends system with search, friend requests, accept/decline, and remove functionality
- Add bet creation with flexible results array, stock image selection, and friend selector
- Add bet review flow where both parties take turns editing, accepting, or proposing void
- Add bets list page with search, status filter, sortable columns, and "your turn" indicator
- Add pending bets notification badge and dropdown menu in header
- Add Bets and Friends navigation links to header

### Fixed

- Ensure avatar editor revert button resets after saving

## [0.15.0] - 2026-04-10

### Fixed

- Prevent unsaved account changes from reverting when switching browser tabs
- Ensure avatar save button is disabled when selecting then removing an image on an account with no avatar
- Fix newly uploaded avatars appearing left-aligned instead of centered on page reload

### Changed

- Handle avatar uploads and removals atomically through the backend to prevent mismatched images between Clerk and R2

## [0.14.2] - 2026-04-08

### Added

- Display animated "broskis bet brewskis." slogan on the login background panel

### Changed

- Update app slogan to "because broskis bet brewskis"

### Fixed

- Fix corrupted avatar uploads and broken image responses caused by binary data being text-encoded in the Vercel serverless adapter

## [0.14.1] - 2026-04-06

### Changed

- Add manual workflow dispatch trigger to production deployment workflows

## [0.14.0] - 2026-04-05

### Fixed

- Prevent Clerk webhook from overwriting the full-size avatar in R2 with the cropped version after saving a photo
- Ensure the avatar editor always displays the full-size image from R2, never the cropped Clerk thumbnail
- Load the full-size avatar immediately after logging in without requiring a page refresh
- Show a skeleton placeholder while the avatar loads instead of the upload dropzone
- Restore the original image and crop values when clicking the revert button in the avatar editor

## [0.13.0] - 2026-04-04

### Added

- Show toast notification on the account page when profile changes are made externally via the Clerk dashboard
- Automatically redirect to home with a toast when the user's account is deleted externally
- Autofocus the verification code input on login and create account pages
- Add unit tests for all frontend components, services, guards, and pages achieving 100% line and function coverage

### Fixed

- Handle Clerk's new device verification by prompting for an email code during login
- Prevent the log in button from briefly flashing in the header during page load
- Preserve current avatar in the editor when an external profile change is detected
- Fix `stringifyContentPathRegex` in Jest config using incompatible regex literal instead of string

## [0.12.0] - 2026-04-04

### Added

- Sync user profile changes made in the Clerk dashboard (name, email, avatar) to the database and R2
- Add delete account option on the account page with confirmation dialog
- Display shimmer skeleton in the avatar editor while the full-size photo loads
- Upload avatar to R2 automatically when a new user is created via webhook
- Allow reverting avatar to the original Clerk profile photo

### Fixed

- Prevent avatar from reverting to cached version after photo change
- Auto-create user record from Clerk data to avoid 404 on first account page visit
- Ensure avatar editor displays the full-size image instead of a placeholder on the account page
- Prevent avatar editor controls from resetting after saving or refreshing the page
- Persist and restore zoom and pan crop state so the edited avatar is always displayed correctly
- Keep account page name in sync with changes made in the Clerk dashboard
- Ensure header avatar updates immediately after photo change
- Prevent old avatar from briefly appearing on account page load before new one renders
- Handle Google SSO sign-in for new users by automatically converting to account creation
- Detect unsaved crop changes correctly when no prior crop state exists

## [0.11.0] - 2026-03-29

### Added

- Use a code input component for the email verification step when creating an account

### Fixed

- Fix spurious "Full-size image could not be loaded" toast appearing on first account page visit
- Fix first name not being saved to the database when updating account details

### Changed

- Update all frontend and backend dependencies to latest versions, resolving security vulnerabilities
- Remove unused `@ngneat/until-destroy` and `angular-feather` dependencies

## [0.10.0] - 2026-03-24

### Added

- Store full-size avatar in Cloudflare R2 for re-editing previously cropped photos
- Automatically create user record on sign-up via Clerk webhook
- Add API service for authenticated backend communication
- Restore Vercel deployment source links to GitHub
- Show preview build info tooltip on logo in preview environment

## [0.9.2] - 2026-03-23

### Fixed

- Fix release workflow race condition causing tag/release creation to fail

## [0.9.1] - 2026-03-23

### Added

- Add changelog validation CI check for version branch PRs
- Add missing v0.9.0 changelog entry

## [0.9.0] - 2026-03-22

### Added

- Add Hono backend with Drizzle ORM and Neon Postgres database
- Add users and bets API routes with CRUD operations
- Add Clerk authentication middleware for backend routes
- Add Supabase storage service for avatar uploads

## [0.8.0] - 2026-03-22

### Changed

- Restructure repo to monorepo layout with `frontend/` and `backend/` subdirectories

## [0.7.0] - 2026-03-22

### Changed

- Upgrade `@eagami/ui` to 0.5.0
- Simplify account page avatar editing to inline flow
- Show specific success messages when saving account changes (e.g., "First name and photo updated")

### Fixed

- Fix global color override breaking library component colors
- Fix SSO callback page briefly flashing before redirect
- Fix header avatar not updating after photo change
- Fix heading color falling back to inheritance due to undefined CSS variable
- Fix login button visibility not updating on route navigation
- Hide login button when already on login page

## [0.6.0] - 2026-03-22

### Added

- Add autofocus to first name field on create account page
- Add avatar with initials fallback to header
- Add dropdown menu with Account and Log out options to header
- Add account page with avatar editor and name editing
- Show header on all pages with "Log in" button for unauthenticated users
- Add toast notifications for account page save feedback
- Add per-field validation errors on account page
- Add current avatar preview to "Remove photo" button
- Disable "Save" button until there are actual changes
- Disable "Remove photo" button when no photo exists

### Changed

- Upgrade `@eagami/ui` to 0.4.1
- Replace custom dividers with `ea-divider` component on auth pages
- Remove branding from auth layout and legal pages (header handles it)
- Use anchor links for header menu items

### Fixed

- Use "log in" instead of "sign in" in privacy policy
- Fix legal page card overflow so card body scrolls internally
- Fix avatar editor icon colours inside account page card

## [0.5.2] - 2026-03-17

### Changed

- Adjusted background image blur and inset on auth layout

### Fixed

- SSO callback not navigating to home page after successful authentication

## [0.5.1] - 2026-03-17

### Fixed

- SSO sign-up redirecting to `/create-account#/continue` instead of home page

## [0.5.0] - 2026-03-17

### Added

- Privacy policy and terms of service pages with card layout and branding
- Privacy/terms links in login and create account page footers

### Fixed

- Password toggle eye icon color not overriding global typography rule
- Auth link hover color now lighter instead of darker

## [0.4.0] - 2026-03-17

### Added

- Preview build configuration for Vercel preview deploys with Clerk development key
- Automatic git tag and GitHub release creation on merge to main
- Additional 120x120 PNG logo asset

### Changed

- Replaced auth page gradient with plain background color
- Adjusted auth layout spacing and branding margins
- Default route for unauthenticated users changed from create account to login
- Title case for browser tab text

### Fixed

- Primary button text appearing black on mobile dark mode (forced `--color-text-inverse` to white)
- Password toggle eye icons now fully opaque, darken to link color on hover
- Card clipped by mobile browser toolbar (`dvh`/`vh` declaration order)
- Header log out button invisible on mobile dark mode
- Preview deployment workflow using correct build command

## [0.3.0] - 2026-03-17

### Added

- Shared `AuthLayoutComponent` with child routes, eliminating layout duplication across auth pages
- Background image fade-in transition on load
- Horizontal divider lines flanking branding on auth pages
- Clerk CAPTCHA element on create account form for bot protection
- Radial gradient vignette on background image edges
- Preview environment with Clerk development key for Vercel preview deploys
- `vercel.json` with environment-aware build command

### Changed

- Converted background image from PNG (11MB) to WebP (250KB)
- Unified app background color across body, meta tags, and manifest
- Consolidated brand-name font styling via `h1` typography rule
- Darkened auth page gradient with subtle blue tint
- Increased card box shadow for better depth contrast
- Increased auth form button font size

## [0.2.0] - 2026-03-16

### Added

- Split-panel auth layout with blurred beer background image on desktop
- Responsive breakpoint mixins for auth page styling

### Changed

- Tightened auth form spacing on mobile for better fit on small screens
- Removed padding above card body, footer, and below card header
- Updated heading typography to use explicit text color
- Upgraded ESLint to v10 with `typescript-eslint` (replacing deprecated v8 setup)
- Pinned `@clerk/clerk-js` and `@eagami/ui` dependency versions
- Resolved Angular peer dependency mismatches via pnpm overrides
- Allowed `utf-8-validate` v6 and `bs58` v5 peer versions

## [0.1.0] - 2026-03-15

### Added

- Clerk authentication with email/password and Google OAuth
- Login, create account, forgot password, and change password pages
- Email verification flow on account creation
- Password reset flow with verification code
- Per-field blur validation on all auth forms
- Frontend validation before API calls
- Google federated login on login and create account pages
- First and last name fields on create account form
- Header bar with branding and log out button
- `@eagami/ui` component integration (`ButtonComponent`, `InputComponent`, `CardComponent`)
- Righteous font for branding

### Fixed

- Auth form UX improvements and Chrome data breach popup prevention
- Stricter email validation with regex
- Error icon color and skip blur validation on empty fields

## [0.0.0] - 2025-11-22

### Added

- Angular 21 project scaffolding with standalone components
- Global SCSS variables, reset, and typography
- PWA manifest and service worker configuration
- GitHub issue templates

[1.5.0]: https://github.com/mwiraszka/brewski-bets/compare/v1.4.2...v1.5.0
[1.4.2]: https://github.com/mwiraszka/brewski-bets/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/mwiraszka/brewski-bets/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/mwiraszka/brewski-bets/compare/v1.3.4...v1.4.0
[1.3.4]: https://github.com/mwiraszka/brewski-bets/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/mwiraszka/brewski-bets/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/mwiraszka/brewski-bets/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/mwiraszka/brewski-bets/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/mwiraszka/brewski-bets/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/mwiraszka/brewski-bets/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/mwiraszka/brewski-bets/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/mwiraszka/brewski-bets/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.30.0...v1.0.0
[0.30.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.29.0...v0.30.0
[0.29.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.20.0...v0.21.0
[0.20.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.14.2...v0.15.0
[0.14.2]: https://github.com/mwiraszka/brewski-bets/compare/v0.14.1...v0.14.2
[0.14.1]: https://github.com/mwiraszka/brewski-bets/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.9.2...v0.10.0
[0.9.2]: https://github.com/mwiraszka/brewski-bets/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/mwiraszka/brewski-bets/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/mwiraszka/brewski-bets/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/mwiraszka/brewski-bets/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/mwiraszka/brewski-bets/releases/tag/v0.0.0
