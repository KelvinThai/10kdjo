# 10kdjo

Online programming teaching platform. Students enroll in courses, watch YouTube-hosted video lessons, take per-lesson quizzes, track progress, and earn a certificate on completion.

## Stack

- **Next.js 16** (App Router, TypeScript) — single codebase, server actions for mutations
- **PostgreSQL 16** — primary data store
- **Auth.js** — Google OAuth + email magic links
- **YouTube iframe API** — video playback + progress heartbeat
- **Tailwind CSS 4** — styling
- **Docker Compose** — production deploy (Postgres + app + Nginx + certbot)

## MVP scope

| Feature | Status |
|---|---|
| Public course catalog | planned |
| Course / lesson pages with YouTube playback | planned |
| Progress tracking (% complete per course, auto-complete at 90% watched) | planned |
| MCQ quizzes per lesson | planned |
| Student dashboard (continue watching, my courses) | planned |
| Certificate PDF on 100% completion | planned |
| Email + Google OAuth sign-in | planned |

Deferred to v1.1: admin UI, email notifications, discussion threads, search.
Deferred to v2: in-browser code editor with auto-grading, Stripe paywall.

See [`docs/MVP-PLAN.md`](docs/MVP-PLAN.md) for the full plan and weekly milestones.

## Local development

Prereqs: Node 22+, pnpm 10+, Docker.

```bash
# 1. Install deps
pnpm install

# 2. Copy the env template and fill in any credentials you have
cp .env.local.example .env.local

# 3. Start Postgres + Mailpit (SMTP catcher with web UI on :8025)
pnpm dev:db

# 4. Apply migrations and seed a placeholder course
pnpm db:migrate
pnpm db:seed

# 5. Start the app
pnpm dev
```

Open <http://localhost:3000>.

Magic-link sign-in works out of the box (emails land in Mailpit at <http://localhost:8025>). Google OAuth requires you to add `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` from Google Cloud Console (authorized redirect URI: `http://localhost:3000/api/auth/callback/google`).

### Useful scripts

| Script | What it does |
|---|---|
| `pnpm dev:db` / `dev:db:down` / `dev:db:logs` | Manage local Postgres + Mailpit |
| `pnpm db:generate` | Generate a SQL migration from schema changes |
| `pnpm db:migrate` | Apply migrations to the configured DB |
| `pnpm db:push` | Push schema directly without migrations (dev only) |
| `pnpm db:studio` | Drizzle Studio (web UI for the DB) |
| `pnpm db:seed` | Seed placeholder data |

## Deployment

Production runs on a self-hosted Ubuntu 22.04 VM behind Nginx + Let's Encrypt, with CI/CD pushing to `main` via GitHub Actions. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (to be written).
