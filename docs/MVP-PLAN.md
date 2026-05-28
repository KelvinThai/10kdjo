# MVP plan

## Goal

Ship a self-hosted programming-course platform where students can enroll in YouTube-backed video courses, take per-lesson quizzes, track progress, and earn a certificate on completion. Free for all users in MVP; payments deferred.

## Stack decisions

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, TS) | One codebase for UI + API |
| DB | PostgreSQL 16 | Reliable, fits everything we need without S3 |
| Auth | Auth.js (Google OAuth + email magic link) | Standard, low friction |
| Video | YouTube iframe API | Videos already on YouTube; zero hosting cost |
| Styling | Tailwind 4 | Fast iteration |
| Package manager | pnpm | Already in use |
| Deploy | Docker Compose on Ubuntu 22.04 VM | Self-hosted, behind Nginx + Let's Encrypt |
| CI/CD | GitHub Actions → SSH deploy | Push to `main` triggers deploy |

## Data model (initial)

```
users            (id, email, name, image, role[student|admin], created_at)
courses          (id, slug, title, description, thumbnail, published, order)
sections         (id, course_id, title, order)
lessons          (id, section_id, title, youtube_id, duration_sec, order)
quizzes          (id, lesson_id, title, pass_score_pct)
quiz_questions   (id, quiz_id, prompt, choices_json, correct_index, order)
enrollments      (user_id, course_id, enrolled_at)
lesson_progress  (user_id, lesson_id, watched_sec, completed_at)
quiz_attempts    (id, user_id, quiz_id, score_pct, passed, attempted_at)
certificates     (id, user_id, course_id, issued_at, serial)
```

## Routes (initial)

```
/                       marketing landing
/courses                public catalog
/courses/[slug]         course detail + enroll
/courses/[slug]/[lesson]  lesson page (video + quiz + progress)
/me                     student dashboard
/cert/[serial]          shareable certificate (PDF download link)
/api/auth/*             Auth.js endpoints
/api/progress           POST lesson progress heartbeat
/api/quiz/submit        POST quiz answers
```

## Weekly milestones (≈4 weeks, one engineer)

### Week 1 — Foundation
- VM provisioned, Docker Compose stack defined
- Next.js + Auth.js (Google + magic link) working end-to-end
- DB schema + migrations
- CI/CD: push to `main` → deploy to VM

### Week 2 — Catalog + playback
- Public catalog page (`/courses`)
- Course detail page (sections + lesson list)
- Lesson page with YouTube embed
- Progress heartbeat (every 30s) + auto-complete at 90% watched
- Enrollment ("Start course" button)

### Week 3 — Quizzes + progress
- MCQ quiz UI under each lesson, pass/fail logic
- Course-level % complete
- Student dashboard (`/me`): enrolled courses, continue-watching

### Week 4 — Certificates + launch
- Certificate PDF generation on 100% completion
- Shareable certificate URL (`/cert/[serial]`)
- Mobile responsive pass + accessibility (captions, keyboard nav)
- Basic analytics (Plausible or Umami self-hosted)
- Seed 1–2 real courses, soft launch

## Content management (MVP)

No admin UI in MVP. Courses are defined as TypeScript seed files in `db/seed/` and loaded via `pnpm seed`. Admin UI moves to v1.1.

## Deferred

**v1.1** — admin UI for course/lesson/quiz CRUD, email notifications, per-lesson discussion threads, search.

**v2** — in-browser code editor with auto-grading (Monaco + Judge0 in Docker), Stripe paywall, paid tracks.

## Competitive notes

- Udemy / Coursera: video-heavy, watch-and-follow. Increasingly being squeezed by interactive platforms.
- Codecademy / Scrimba: interactive in-browser coding wins on engagement. That's our v2 direction.
- Open edX / Moodle: rejected — fighting their UX wastes more time than building custom.
