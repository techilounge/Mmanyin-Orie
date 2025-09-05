# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Permissions and State Management**: 
  - Corrected Firestore security rules to grant appropriate read permissions to members with the 'user' role, allowing them to see community data like families, members, and payments. Write and delete permissions remain restricted to admins and owners.
  - Stabilized the `CommunityProvider` by adding the `user` object to the `useEffect` dependency array. This resolves a critical state management bug that caused the application to switch to the wrong community context for users belonging to multiple communities.
  - Corrected the `getInviteLink` function to provide clearer error feedback in the UI when an invitation cannot be found.

### Fixed
- **Invitation Acceptance**: Corrected the Firestore security rules to allow a newly authenticated user to read and update their own invitation document. This resolves the persistent "Missing or insufficient permissions" error and allows the user to successfully join a community after accepting an invitation.

### Fixed
- **Avatar Upload**: Switched from an unreliable server-side API route to a direct client-side upload using the Firebase Web SDK. This resolves persistent CORS and token audience (`aud`) mismatch errors encountered in the Firebase Studio preview environment by no longer using the Admin SDK for this operation. The `lib/upload-avatar.ts` file has been updated with the new client-side logic, and the unused API route at `src/app/api/upload-avatar/route.ts` has been stubbed out.

### Added
- Created `CHANGELOG.md` to track project modifications.
- Added an instruction to `README.md` to prevent AI from modifying `.env.local` without approval.

### Fixed
- **Avatar Upload**: Implemented a server-side API route (`/api/upload-avatar`) to handle avatar uploads. This bypasses client-side CSP restrictions in Firebase Studio. The client-side code in `avatar-uploader.tsx` now posts to this route instead of directly to Firebase Storage.
- **Avatar Upload**: Added `firebase-admin` dependency and a dedicated Admin SDK initializer (`src/src/lib/firebase-admin.ts`) to ensure robust and correctly configured server-side operations.
- **Email Sending**: Resolved a persistent issue with sending invitation emails via the Resend API.
  - Corrected the `.env.local` variable usage for server-side functions.
  - Fixed the construction of the "from" email address in `src/lib/email.ts` to match Resend's required format (`Name <email@domain.com>`), resolving the "Invalid `from` field" error.
- **Invitation Links**: Ensured that generated invitation links use the correct custom domain specified in the environment variables.
- **Build Errors**: Corrected various syntax errors in `.tsx` files that were causing the Next.js build to fail.
- **Multi-Community Routing**: Fixed a bug where a user belonging to multiple communities was not prompted to select a community on login. The logic was corrected to route them to the `/app/switch-community` page if no primary community is set.
