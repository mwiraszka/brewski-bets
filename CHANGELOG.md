# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.6.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/mwiraszka/brewski-bets/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/mwiraszka/brewski-bets/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/mwiraszka/brewski-bets/releases/tag/v0.0.0
