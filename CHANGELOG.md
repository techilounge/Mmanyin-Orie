# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Invitation Flow**: The "Resend Invite" feature was crashing due to a missing Firestore import (`orderBy`). This has been fixed. The dialog for resending invites has also been made more robust to gracefully handle cases where no pending invitation is found for a member.
- **Invitation Flow**: Replaced the entire invitation sending and accepting logic with a more robust system. This resolves a critical bug where users clicking on older, stale invitation links would see an "invite already used" error. The new system now revokes old links when a new one is sent and automatically redirects the user from a stale link to the newest valid one, ensuring a smooth user experience.

### Changed
- **Member Deletion**: Implemented a "clean delete" process. When deleting a member, the system now checks if they belong to other communities. If it's their last community, their user document and avatar are deleted from Firestore. If they belong to multiple communities, they are only removed from the current one, preserving their main user account.

### Added
- **Firestore Security Rules**: Replaced the entire `firestore.rules` with a more robust and granular ruleset. This resolves "Missing or insufficient permissions" errors during sign-in and on the invitation acceptance page by allowing necessary public reads while securing sensitive data.
- **New Member Notifications**: Implemented a robust email notification system using the "Trigger Email" Firebase Extension. Community owners and admins are now notified when a new member joins.

### Fixed
- **Invitation Flow**: 
  - Replaced the invitation acceptance page (`src/app/auth/accept-invite/page.tsx`) with a new version that correctly handles loading/error states and only reads data permitted by the new security rules.
  - Fixed the "Invitation Sent" dialog in `src/components/community/dialogs/invite-member-dialog.tsx` to be properly controlled, ensuring it can be dismissed correctly after an invite is sent.
- **Email Notifications**: Replaced a fragile client-side email trigger with a reliable server-side solution leveraging the "Trigger Email" extension, ensuring notifications are sent consistently when members are added or accept invitations.
- **Avatar Upload**: Switched from an unreliable server-side API route to a direct client-side upload using the Firebase Web SDK. This resolves persistent CORS and token audience (`aud`) mismatch errors encountered in the Firebase Studio preview environment by no longer using the Admin SDK for this operation. The `lib/upload-avatar.ts` file has been updated with the new client-side logic, and the unused API route at `src/app/api/upload-avatar/route.ts` has been stubbed out.

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
