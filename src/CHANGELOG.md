# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Server Crash**: Fixed a critical server crash caused by an invalid async function call in the SecuritySettings component. The logic has been correctly moved into a `useEffect` hook to follow React patterns, resolving the "invalid response" error.
- **Finalized Security Rules**: Corrected and finalized all Firestore security rules to resolve all outstanding permission errors. This includes fixing data visibility for regular users, stabilizing the "Switch Community" page, and securing the invitation acceptance workflow. Added a rule to restrict community document updates to admins and owners.
- **Invitation Acceptance**: Corrected the Firestore security rules to allow a newly authenticated user to read and update their own invitation document. This resolves the persistent "Missing or in-sufficient permissions" error and allows the user to successfully join a community after accepting an invitation.
- **Email Sending**: Fixed a critical bug where invitation emails failed to send via Resend. The `from` address was not being formatted correctly as `Name <email@domain.com>`, which is required by the Resend API, causing silent delivery failures. The logic has been corrected to ensure proper formatting.
- **Invitation Link Retrieval**: Fixed an infinite loop and multiple error toasts in the "Resend Invite" dialog. The `getInviteLink` function was removed from a `useEffect` dependency array to prevent re-renders, and its internal logic was corrected to avoid showing redundant error messages, allowing the UI to handle the error state gracefully.
- **Invitation Link Retrieval**: Fixed a critical bug where retrieving an invitation link for a member would fail due to a Firestore security rule violation. The logic in `getInviteLink` was incorrectly trying to read the `/invitations` collection, which is restricted. The function has been simplified to construct the link directly from the `inviteId` stored on the member document, resolving the error.
- **Permissions and State Management**: 
  - Corrected Firestore security rules to grant appropriate read permissions to members with the 'user' role, allowing them to see community data like families, members, and payments. Write and delete permissions remain restricted to admins and owners.
  - Stabilized the `CommunityProvider` by adding the `user` object to the `useEffect` dependency array. This resolves a critical state management bug that caused the application to switch to the wrong community context for users belonging to multiple communities.
- **Community Loading**: Corrected Firestore security rules to allow a user to read the top-level document of communities they are a member of. This resolves a critical "Missing or insufficient permissions" error on the "Switch Community" page, which prevented users from loading their list of communities.

### Added
- **Family Head Permissions**: The head of a family (patriarch) can now add or invite members directly to their own family, mirroring the functionality available to admins.

### Fixed
- **Invitation Acceptance**: Corrected the Firestore security rules to allow a newly authenticated user to read and update their own invitation document. This resolves the persistent "Missing or in-sufficient permissions" error and allows the user to successfully join a community after accepting an invitation.

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
