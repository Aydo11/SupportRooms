# SupportRooms

A UK supported-accommodation marketplace: people looking for supported housing on one side,
providers advertising rooms on the other, and professionals making referrals between them.

Built as a working base to extend — real database, real auth, real permissions, no mock data
layer. Everything visible in the demo comes out of Postgres.

---

## Running it

```bash
npm install
cp .env.example .env          # set DATABASE_URL and AUTH_SECRET at minimum
npm run setup                 # prisma generate + db push + seed
npm run dev
```

Open http://localhost:3000.

`npm run setup` is destructive — the seed clears the tables it owns before inserting.

### Demo accounts

Password for all of them: `Password123!`

| Role | Email |
| --- | --- |
| Admin | `admin@supportrooms.test` |
| Looking for housing | `jordan@example.test`, `amara@example.test`, `kieran@example.test`, `priya@example.test` |
| Provider | `dan@ashfieldsupported.test`, `hafsa@northgatetrust.test`, `marcus@beaconrecovery.test`, `nadia@harboursideliving.test` |
| Referrer | `referrer@example.test`, `housingoptions@example.test` |

Every organisation, person, address and postcode in the seed is invented.

---

## What's in it

**Public** — home, search with filters and a map view, advert pages with a photo gallery and
room-level availability, provider profiles, the people-looking side of the marketplace, pricing,
how it works, safety, verification, privacy and terms.

**People looking** (`/dashboard`) — profile with granular privacy switches, a "what I'm looking
for" advert, saved properties with availability alerts, requests with a status trail, messages,
notifications, data export and account deletion.

**Providers** (`/provider`) — dashboard with occupancy and analytics, multi-step advert creation,
media manager with drag-to-reorder and a primary image, a room status board, requests and referrals
worklists, membership and billing, company profile and verification.

**Referrers** (`/referrals`) — referral list, a referral form with private document upload, and a
per-referral timeline.

**Admin** (`/admin`) — advert approval queue, verification review, reports, users, providers,
requests, referrals, memberships and payments, support categories, and an audit log.

---

## How it's put together

```
prisma/schema.prisma      All models and enums
prisma/seed.ts            Demo data
src/brand.config.ts       Name, tagline, trust wording — rename the product here
src/lib/                  db, session, rbac, audit, validation, taxonomy, format, matching
src/lib/{storage,billing,notify}.ts   Adapters for external services
src/server/actions/       Server Actions, one file per domain
src/server/search.ts      Search queries for both sides of the marketplace
src/app/(site)/           All pages
src/app/api/              Private document serving, billing webhook
```

- **Next.js 14 App Router**, TypeScript, Tailwind. Mutations are Server Actions, not REST.
- **Auth** is bcrypt plus a signed JWT (`jose`) in an httpOnly cookie. No NextAuth.
- **Permissions** live in `src/lib/rbac.ts`. Pages call `requireUser` / `requireCompany` /
  `requireReferrer` / `requireAdmin`; actions re-check ownership before writing.
- **Validation** is Zod, in `src/lib/validation.ts`, shared between actions and forms.
- **Money is stored in pence** everywhere.
- **Support categories are database rows**, editable by admins, not hard-coded strings.

### Search

Built for a catalogue in the thousands rather than the dozens:

- Free text matches across title, summary, description, support blurb, town, area and provider
  name. Every word has to appear somewhere, so extra words narrow rather than widen.
- A town or postcode is geocoded and becomes a **radius search** (1–100 miles), with distance shown
  on each result. If geocoding fails it falls back to a name match.
- The map is real Leaflet with OpenStreetMap tiles, price pins, clustering at low zoom, and a
  **search this area** button that turns the viewport into a `bbox` filter.
- Refinement chips carry **counts**, so nobody has to guess which filter will empty the results.
- Pagination is windowed and capped at 40 pages; past that the interface asks people to narrow down
  rather than paging into the hundreds.
- If the catalogue outgrows this, `textFilter()` in `src/server/search.ts` is the single function to
  replace with a tsvector column or a search service. Nothing outside it needs to change.

### Sponsored placement

- Sponsored adverts fill up to three labelled slots at the top of **page one only** — never page two
  onwards — and are fetched separately so they can't distort organic ranking.
- They still have to match the query. Paying can't put an advert in front of someone it doesn't fit.
- Slot order is by package length (`sponsoredBid`), and buying again extends the end date rather
  than replacing it. Expiry is enforced in the query, not by a cron job.
- Impressions are counted where they're shown, clicks via `?ref=sponsored` on the advert link, and
  both appear in the provider's sponsor panel.
- Paying changes nothing about verification, moderation, or whether an advert is approved.

### Swapping the external services

Each adapter picks a driver from an env var and exposes one interface, so nothing else changes:

| Concern | File | Drivers |
| --- | --- | --- |
| File storage | `src/lib/storage.ts` | `local` (default), `s3` (stub) |
| Billing | `src/lib/billing.ts` | `mock` (default), `stripe` (stub) |
| Email / SMS | `src/lib/notify.ts` | `console` (default), `resend`, `twilio` |
| Map tiles | `src/components/map-view.tsx` | OpenStreetMap by default; set `NEXT_PUBLIC_MAP_TILE_URL` for a paid provider |
| Geocoding | `src/lib/geo.ts` | `postcodes` (postcodes.io, free, UK) or `none` |

The stubs throw a clear message telling you which file to implement. Prices in the seed are
placeholders.

---

## Security

See [SECURITY.md](SECURITY.md) for the full picture — controls in place and the
honest list of what still needs doing before real data goes near it.

The short version: bcrypt + signed-JWT sessions with revocation, RBAC enforced
next to the data rather than in middleware, private files stored outside the web
root and served only through a permission-checked audited route, uploads verified
by magic bytes, `sanitize-html` on the one HTML input, CSP and HSTS headers,
rate limiting on every abusable action, and no raw SQL anywhere. Missing: email
verification, password reset, MFA, and a shared-store rate limiter.

## Privacy decisions worth knowing

These are deliberate, and changing them changes the product:

- Profiles are private by default. Providers only see someone in the people search if that person
  turns on "let providers find me".
- Advert addresses show the town and outward postcode only, unless the provider opts into
  publishing the full address.
- Referral detail is visible to the referrer, the receiving provider, and admins. Nobody else.
- Admins can moderate accounts and content but **cannot read message bodies**.
- Private documents (referral attachments, verification evidence) are never linked from storage.
  Every read goes through `/api/documents/[id]`, which checks permissions and writes an audit entry.
- Deleting an account soft-deletes it and blanks the profile immediately; a minimal record is kept
  briefly so providers can close their side.

## Trust wording

The verified badge means a person on the admin team checked documents confirming who a provider is.
It is not a regulatory registration or an inspection, and the copy on `/verification` says so.
Match percentages are a search convenience, not an eligibility or clinical judgement. Promoted
adverts are always labelled. Keep all three of those honest if you extend this.

---

## Things left for you

- Email templates (notifications currently log to the console).
- Real S3 and Stripe implementations behind the existing adapters.
- A tile provider for the map if you want a basemap rather than plotted coordinates.
- Tests. There are none.
- Email verification, password reset and MFA (see SECURITY.md).
- A Redis rate-limit driver before running more than one instance.
