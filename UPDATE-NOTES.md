# UI and admin team update

Based on the desktop repository at commit 54178df. This update does not deploy itself.

## Deployment

1. Commit these changes from GitHub Desktop and push to your existing repository.
2. Apply the Prisma schema before starting the new app. There is one additive field: `User.adminPermissions`, defaulting to `["ALL"]` to preserve existing admin access. Non-admin accounts do not gain admin access. Back up the database before schema changes. Never use `--accept-data-loss` for this update.
3. Run the normal build and start process. Keep `DATABASE_URL` and `DIRECT_URL` configured as required by your existing schema.
4. Sign in as your existing full administrator and open **Team & permissions**. Add a colleague, copy their one-hour setup link and send it privately. They choose their own password. Do not post this link publicly. Expired links can be replaced through Forgot password when email delivery is configured.

## Access levels

- Full administrator: existing platform administration plus team management.
- Moderator: advert review and reports only. No billing, private document, referral, private people-profile or team-management access. Moderators cannot sponsor adverts.
- Team changes require the acting administrator's password, invalidate the changed account's sessions and are recorded in the audit log. Self-demotion is disabled and updates preserve at least one active full administrator.

This manages the SupportRooms platform team, not provider company memberships.

## Sentry activation

Create a Next.js project in Sentry. In Render set `NEXT_PUBLIC_SENTRY_DSN` to its DSN and optionally `SENTRY_DSN` for server events. Rebuild after changing the public DSN so both the client bundle and the Content Security Policy use it.

Optional source-map uploads: set `SENTRY_ORG`, `SENTRY_PROJECT`, and the secret `SENTRY_AUTH_TOKEN` in Render (never commit the token).

Without a DSN, reporting is disabled. Session replay and performance tracing are disabled. Request details, identity, breadcrumbs, extra context and exception messages are removed before sending errors. Review your Sentry retention, access and data-processing settings before launch. Sending a test event and confirming receipt still requires your Sentry project credentials.

## Manual checks after deployment

- On a narrow phone screen, open navigation then tap a destination, the current destination, or outside. The menu should close. Escape closes it and restores focus to its toggle.
- Open an advert: status and promotion details occupy their own strip, with compact wrapping action buttons below.
- Create a moderator, set their password and verify adverts/reports work while other admin URLs and private documents are denied.
- Suspend that test account and confirm its existing session no longer works.
- Test uploading a photo. The upload-size configuration is now correctly nested under `experimental.serverActions` for this installed Next.js version.
