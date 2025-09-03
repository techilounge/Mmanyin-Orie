# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created `CHANGELOG.md` to track project modifications.
- Added an instruction to `README.md` to prevent AI from modifying `.env.local` without approval.

### Fixed
- **Avatar Upload**: Implemented a server-side API route (`/api/upload-avatar`) to handle avatar uploads. This bypasses client-side CSP restrictions in Firebase Studio. The client-side code in `avatar-uploader.tsx` now posts to this route instead of directly to Firebase Storage.
- **Avatar Upload**: Added `firebase-admin` dependency and a dedicated Admin SDK initializer (`src/lib/firebase-admin.ts`) to ensure robust and correctly configured server-side operations.
- **Email Sending**: Resolved a persistent issue with sending invitation emails via the Resend API.
  - Corrected the `.env.local` variable usage for server-side functions.
  - Fixed the construction of the "from" email address in `src/lib/email.ts` to match Resend's required format (`Name <email@domain.com>`), resolving the "Invalid `from` field" error.
- **Invitation Links**: Ensured that generated invitation links use the correct custom domain specified in the environment variables.
- **Build Errors**: Corrected various syntax errors in `.tsx` files that were causing the Next.js build to fail.
- **Multi-Community Routing**: Fixed a bug where a user belonging to multiple communities was not prompted to select a community on login. The logic was corrected to route them to the `/app/switch-community` page if no primary community is set.

