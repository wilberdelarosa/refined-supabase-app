# Email and notification research - 2026-03-10

## What the product actually needs

The repo already sends transactional email with `Resend`, but the current setup is still "single function sends HTML". For production you need four separate capabilities:

1. Delivery: a provider that reliably sends transactional email from your app domain.
2. Templates: versioned templates with preview data and a safe rendering workflow.
3. Internal inbox: user-facing notifications inside the app, with read state and preferences.
4. Auditability: queued, sent, failed and skipped delivery records.

## Best-fit options found

### 1. Best for app-owned transactional email: Resend + React Email

- Resend is already in the repo, so the lowest-risk path is to harden what already exists.
- Resend supports domain verification and transactional sending from your own branded address.
- React Email gives local template authoring and preview, which is the easiest way to review desktop/mobile layouts before shipping.

Good fit when:
- the sender is the store or workspace, not each user's personal mailbox
- you want templates in code review
- you want a simple production path now

Official references:
- Resend docs: https://resend.com/docs
- Resend domains: https://resend.com/docs/dashboard/domains/introduction
- React Email docs: https://react.email/docs/introduction
- React Email repo: https://github.com/resend/react-email

### 2. Best for "connect my mailbox by link": Nylas Hosted OAuth

- If the real requirement is "the user clicks a link, grants Gmail or Microsoft permissions, and the app can send using that mailbox", this is the cleanest current fit.
- Nylas Hosted OAuth handles the account connection flow and exposes a send API after the mailbox is connected.

Good fit when:
- each tenant/user must send from their own mailbox
- you want a hosted auth link instead of building Google/Microsoft OAuth yourself
- you accept extra provider complexity and cost

Official references:
- Hosted OAuth: https://developer.nylas.com/docs/v3/auth/hosted-oauth-accesstoken/
- Send email: https://developer.nylas.com/docs/v3/email/send-email/

### 3. Best if later you want multi-channel orchestration: Novu

- Novu is strong when you want one event to fan out into inbox + email + push + SMS with workflow logic.
- It is more infrastructure than you need right now, but it becomes useful if the notification domain keeps growing.

Good fit when:
- you need a notification center, preferences and workflow orchestration beyond email
- you are okay introducing another platform instead of keeping it inside Supabase

Official references:
- Novu docs: https://docs.novu.co/
- Novu repo: https://github.com/novuhq/novu

## Recommendation for this repo

Use a two-track approach:

- Track A, now: keep `Resend` for delivery and move templates to `React Email`.
- Track B, optional later: add `Nylas` only if you truly need user-connected Gmail/Outlook sending via auth link.

Why this is the correct split:

- Store/order/billing notifications should come from your verified business domain. That gives better deliverability, fewer OAuth edge cases and cleaner support.
- "Send from the mailbox the user connected by link" is a different product requirement. It is useful for CRM/helpdesk style apps, but not required for a normal ecommerce/store notification pipeline.

## What was added in the migration

The SQL foundation added today creates:

- `notification_templates`: template registry, renderer metadata and preview payloads.
- `notification_preferences`: per-user channel/topic toggles.
- `notification_sender_accounts`: generic model for sender identities, including OAuth-linked mailboxes later.
- `notification_dispatches`: queue/audit table for email and other delivery attempts.
- `queue_notification(...)`: a database entry point that creates inbox records and enqueues email deliveries.

It also extends `public.notifications` so the inbox can carry topic, template, scheduling and dedupe metadata.

## What still needs implementation after the migration

1. Create an `/emails` folder with React Email templates matching:
   - `emails/order-created.tsx`
   - `emails/order-status-changed.tsx`
   - `emails/payment-verified.tsx`
   - `emails/invoice-issued.tsx`
2. Replace the inline HTML in `supabase/functions/send-order-email/index.ts` with template rendering.
3. Add a worker path for queued rows in `notification_dispatches`.
4. Add an admin UI for:
   - sender identity
   - default channels
   - preview payloads
   - test send
5. Add a customer UI for `notification_preferences`.

## Important repo note

The new SQL was placed in `supabase/migrations/20260310_improvements/` because that was requested. Supabase CLI normally expects runnable migrations at the root of `supabase/migrations`, so if you want this executed automatically in the standard flow, promote it to a timestamped root migration afterward.
