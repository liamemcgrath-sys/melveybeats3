# Melvey Beats v0.2.0

Production storefront for www.melvybeats.com: blue browsing experience, one active preview player, tiered cart, Stripe checkout, Supabase accounts and purchase libraries, and an owner-only Studio linked quietly in the footer.

## Production state

The original 15 listings were removed from `public.beats` and copied with every master audio path to `melvey_private.archived_listings` on October 8, 2026. Storage objects and previous Stripe purchase metadata remain intact. The new catalog starts empty; it never seeds demo beats. The SQL in `supabase/migrations/20261008200455_melvey_store_v02.sql` was applied through the connected Supabase SQL service. The database migration tool initially returned an expired-request error, so the successful SQL execution did not create a Supabase migration-history entry.

## Owner setup

Studio access is tied to a Supabase user ID in `melvey_settings.admin_owner_id`. An authenticated account may enroll only with the private one-time setup code. The server stores only the SHA-256 verifier in `MELVEY_ADMIN_ENROLLMENT_HASH`; the code itself is not stored in Vercel or this repository. Once claimed, another account cannot claim or overwrite ownership, even with the same setup link. Native email/password signup and confirmation are handled by Supabase. Production account email delivery uses the project's existing Supabase Auth mail configuration.

## Payments and downloads

The existing `STRIPE_SECRET_KEY` selects live or test Stripe mode. There is no simulated approval fallback. Server-side prices are reserved in an atomic PostgreSQL function before Stripe Checkout opens. Exclusive holds reject overlapping standard/exclusive checkout attempts. Paid fulfillment is idempotent and marks exclusive beats sold. Cancelling an open Stripe checkout releases its hold. Expired holds release only after Stripe verifies expiry; failures keep inventory reserved. The success route and catalog reconcile paid sessions into account libraries. Optional Stripe webhooks use `STRIPE_WEBHOOK_SECRET` at `/api/stripe/webhook`.

New preview, artwork, and master uploads use the private `melvey-store` bucket. Signed direct uploads avoid Vercel's request-body limit and are verified against actual file size and format signatures before publishing. Limits: preview 20 MB, master 40 MB, artwork 5 MB. Purchased master downloads require the matching account's paid order or the administrator. Receipts preserve immutable snapshots when catalog metadata changes or beats are removed. Existing purchases retain the legacy `/api/download-beat` route.

All catalog/admin/account tables use RLS and are unavailable directly to anonymous or ordinary authenticated clients. The server validates native Supabase identity and ownership on each protected action. Legacy password-based admin APIs are retired; public passwords and the previous admin bypass have been removed from source.

## Develop and verify

Copy `.env.example` to `.env.local` and configure development credentials. Never commit credentials. Run `npm ci`, `npm run dev`, and `npm test`. `npm test` covers browsing/cart/playback validation and real PostgreSQL functions in isolated PGlite, including archive integrity, exclusive conflicts, duplicate checkout/fulfillment, buyer ownership, and one-time admin enrollment. `npm run build` validates the Next.js 16.2.9 production build.

A build and automated fixtures do not verify delivery of real signup emails or make a live payment. Those depend on existing Supabase/Stripe settings.
