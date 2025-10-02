# Welcome to Mmanyin Orie: A User Guide

Mmanyin Orie is your digital home for preserving lineage, community, and tradition. This guide will walk you through the key features of the application and help you manage your kindred association with ease.

## Table of Contents
1.  [Getting Started](#1-getting-started)
    - [Creating Your First Community](#creating-your-first-community)
    - [Joining via Invitation](#joining-an-existing-community)
2.  [The Main Dashboard](#2-the-main-dashboard)
3.  [Managing Your Community (Admin/Owner Guide)](#3-managing-your-community-adminowner-guide)
    - [The Admin Tabs](#the-admin-tabs)
    - [Creating Families](#creating-families)
    - [Adding & Inviting Members](#adding--inviting-members)
    - [Recording Payments](#recording-payments)
    - [Configuring Settings](#configuring-settings)
4.  [Managing Your Family (Patriarch/Family Head Guide)](#4-managing-your-family-patriarchfamily-head-guide)
5.  [Managing Your Profile](#5-managing-your-profile)
6.  [Troubleshooting](#6-troubleshooting)

---

## 1. Getting Started

### Creating Your First Community
If you are the first person from your kindred to use the app, you will be setting up the community.

1.  **Sign Up:** Create a new account using your email or Google account.
2.  **Choose a Plan:** You will be directed to a subscription page. Select the **"Free Tier"** to get started.
3.  **Name Your Community:** You will be prompted to enter a name for your community (e.g., "The Igbo Union of Metro Atlanta").
4.  **Done!** After you name your community, you will be taken directly to your new, empty dashboard, ready for you to start building. You are now the **Owner** of this community.

### Joining an Existing Community
If your community already exists on Mmanyin Orie, you will join by invitation.

1.  **Receive Email:** You will receive an invitation email from your community administrator or family head.
2.  **Accept Invitation:** Click the "Accept Invitation" button in the email.
3.  **Sign In or Sign Up:** You will be taken to a page where you can either sign in to your existing Mmanyin Orie account or create a new one. **Important:** If the invitation was sent to a specific email, you must sign up or sign in with that same email address.
4.  **Confirmation:** After you are authenticated, the system will automatically add you to the community and take you to the community dashboard.

---

## 2. The Main Dashboard

The dashboard is your central hub for managing and viewing your community. It is organized into several tabs:

*   **Dashboard:** An overview of key statistics like total members, families, and financial contributions.
*   **Members:** A detailed list of all members in the community.
*   **Families:** A view of all the families that make up your community.
*   **Payments:** A dedicated section to view and record payments for members.
*   **Reports:** Downloadable PDF and CSV reports for member lists, payments, and more.
*   **Settings (Admin/Owner only):** Configure global settings for your community.

---

## 3. Managing Your Community (Admin/Owner Guide)

As an Admin or Owner, you have full control over the community.

### The Admin Tabs

*   **Members Tab:** View all members, search by name or email, and filter by family or age group. You can edit any member's details or delete them from here.
*   **Families Tab:** View all families. You can create new families or delete existing ones.
*   **Payments Tab:** Select any member to view their detailed payment history, see outstanding balances for each contribution type, and record new payments.
*   **Reports Tab:** Generate and download reports. This is useful for official record-keeping or sharing data offline.
*   **Settings Tab:** This is where you configure the core rules for your community.

### Creating Families

1.  Click the **"Create Family"** button in the header.
2.  Enter the first and last name of the **father** (patriarch). The family will be named after him.
3.  Select the father's age group.
4.  Click "Create Family". This creates the family and adds the father as its first member and head.

### Adding & Inviting Members

You have two options for adding members:

*   **Invite Member (Recommended):** Click the **"Invite Member"** button in the header. This is for members who have an email address. They will receive an invitation link to join and will manage their own account details.
*   **Add Member (Directly):** Click the **"Add Member"** button from within a family's card. This is for adding family members (like children or elders) who may not have an email address. You will manage their profile for them.

### Recording Payments

1.  Go to the **Payments** tab.
2.  Select the member from the dropdown list.
3.  Their payment details will appear, showing each contribution they owe.
4.  For one-time payments, click the **"Record"** button.
5.  For monthly payments, expand the section to view the monthly breakdown and click **"Pay"** for the desired month.
6.  Enter the amount and date, then confirm.

### Configuring Settings

Go to the **Settings** tab to:
*   **Set the Currency:** Choose the currency symbol (e.g., $, ₦, €) for all financial tracking.
*   **Manage Age Groups:** Define the age categories for your members (e.g., "Youth (0-17)", "Adults (18-50)").
*   **Create Contribution Types:** Set up the different types of payments members need to make (e.g., "Annual Dues", "Building Fund"). You can specify the amount, frequency (one-time or monthly), and which age groups it applies to.

---

## 4. Managing Your Family (Patriarch/Family Head Guide)

If you are designated as the head of a family (`isPatriarch: true`), you have special permissions to manage your own family, even if you aren't a community-wide admin.

*   On the **Families** tab, find your family's card.
*   You will see **"Add Member"** and **"Invite Member"** buttons at the bottom of the card.
*   These buttons work just like the admin versions but are restricted to adding members *only to your own family*.
*   You can also edit the details of your family members by clicking the edit icon next to their name.

---

## 5. Managing Your Profile

*   Click on your avatar in the top-right corner to open the profile menu.
*   Select **"Profile"** to go to your personal account settings page (`/app/profile`).
*   Here you can:
    *   Update your display name.
    *   Change your profile avatar.
    *   Change your email or password.
    *   Sign out of the application.
*   If you belong to multiple communities, the profile menu will also have a **"Switch Community"** link.

---

## 6. Troubleshooting

*   **"Missing or insufficient permissions" error:** This usually means there's a mismatch between your account and your membership records.
*   **I've accepted an invite but can't see my community:** Your membership record might not be linked correctly.
    *   **Solution for both:** Go to the **Membership Repair Tool** by navigating to `/tools/repair-memberships` in your browser's address bar. Click the "Repair My Memberships" button. This will fix the data linking your account to your communities. After it's done, go back to the app.
*   **I'm a family head but don't see the "Invite Member" button:** Your profile may not have the `isPatriarch` flag set correctly. Please contact your community administrator to have them edit your member profile and enable it.
