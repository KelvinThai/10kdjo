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

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Deployment

Production runs on a self-hosted Ubuntu 22.04 VM behind Nginx + Let's Encrypt, with CI/CD pushing to `main` via GitHub Actions. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (to be written).
