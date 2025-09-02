# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created `CHANGELOG.md` to track project modifications.
- Added an instruction to `README.md` to prevent AI from modifying `.env.local` without approval.

### Fixed
- **Email Sending**: Resolved a persistent issue with sending invitation emails via the Resend API.
  - Corrected the `.env.local` variable usage for server-side functions.
  - Fixed the construction of the "from" email address in `src/lib/email.ts` to match Resend's required format (`Name <email@domain.com>`), resolving the "Invalid `from` field" error.
- **Invitation Links**: Ensured that generated invitation links use the correct custom domain specified in the environment variables.
- **Build Errors**: Corrected various syntax errors in `.tsx` files that were causing the Next.js build to fail.
