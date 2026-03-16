# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mwiraszka/brewski-bets/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/mwiraszka/brewski-bets/releases/tag/v0.0.0
