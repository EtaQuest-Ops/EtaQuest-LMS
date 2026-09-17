# EtaQuest LMS — Setup & Deployment

This is a Cloudflare Pages project with a real backend (Pages Functions +
D1 database) — no more mock data. Everything below runs on Cloudflare.

## 0. One-time setup

```
npm install -g wrangler
wrangler login
```

## 1. Create the database

```
wrangler d1 create etaquest-lms
```

This prints a `database_id`. Paste it into `wrangler.toml` in place of
`REPLACE_WITH_YOUR_D1_DATABASE_ID`.

## 2. Load the schema + seed data

```
wrangler d1 execute etaquest-lms --local --file=./schema.sql
```

(`--local` sets up a local SQLite copy for testing. Repeat without
`--local`, i.e. with `--remote`, once you're ready to go live.)

## 3. Run it locally

```
wrangler pages dev . --d1=DB
```

Open the printed `localhost` URL. This is your "local dashboard" —
fully functional, backed by the local D1 copy.

### Demo accounts (all use password: `password123`)

| Email | Role |
|---|---|
| `admin@etaquest.co` | Admin (super-admin, all schools) |
| `hod@alnoor.edu` | Head of Department (Al Noor Academy) |
| `sarah@alnoor.edu` | Educator (Al Noor Academy) |
| `james@greenfield.edu` | Educator (Greenfield International) |

**Change these passwords (or delete these accounts) before going live.**
To add a real user, generate a password hash with:

```
node scripts/generate-password-hash.js "theirRealPassword"
```

Then insert them into the `users` table with that hash — either via
`wrangler d1 execute` with an `INSERT` statement, or the Cloudflare
dashboard's D1 query console.

## 4. Deploy to production

```
wrangler d1 execute etaquest-lms --remote --file=./schema.sql
wrangler pages deploy .
```

Or connect the project to your GitHub repo in the Cloudflare dashboard
for auto-deploys on push. Either way, go to your Pages project →
**Settings → Functions → D1 database bindings** and bind `DB` to the
`etaquest-lms` database if it isn't already picked up from
`wrangler.toml`.

## Where to put the Canva smart-embed links

Each row in the `courses` table has an `embed_url` column — that's the
only place they go. Once you have the real Canva smart-embed URLs for
each curriculum, run:

```sql
UPDATE courses SET embed_url = 'https://www.canva.com/design/XXXX/view?embed' WHERE id = 'c-arduino-unoq';
UPDATE courses SET embed_url = 'https://www.canva.com/design/XXXX/view?embed' WHERE id = 'c-nous-ai';
UPDATE courses SET embed_url = 'https://www.canva.com/design/XXXX/view?embed' WHERE id = 'c-sharkbot';
UPDATE courses SET embed_url = 'https://www.canva.com/design/XXXX/view?embed' WHERE id = 'c-icbricks';
```

Run each with:

```
wrangler d1 execute etaquest-lms --local --file=./update-embeds.sql   # test locally first
wrangler d1 execute etaquest-lms --remote --file=./update-embeds.sql  # then production
```

(Save those UPDATE lines into a file called `update-embeds.sql` first.)
The course viewer page automatically switches from the "not linked yet"
placeholder to a live iframe the moment `embed_url` is filled in — no
code changes needed.

## Roles at a glance

| Role | Scope | Can do |
|---|---|---|
| **Admin** | All schools | Switch between schools, see licensed curricula, see all educators + their stats, see all schools |
| **Head of Department** | One school | View `reports.html`: every educator's curriculum completion % and login history |
| **Educator** | One school | See their assigned curricula, open a course, update their own progress |

## Adding a school, educator, or HOD later

There's no admin UI for this yet (by design, to keep the approved
scope small) — it's a few `INSERT` statements against `schools` /
`users` / `school_courses` / `educator_courses`, run the same way as
the embed-link updates above. Happy to build an in-app admin form for
this once the core is approved and deployed.
