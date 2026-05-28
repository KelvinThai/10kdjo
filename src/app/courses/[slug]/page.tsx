import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { courses, sections, lessons, enrollments } from "@/db/schema";
import { enrollAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1);

  if (!course || !course.published) notFound();

  const courseSections = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, course.id))
    .orderBy(asc(sections.displayOrder));

  const sectionLessons =
    courseSections.length === 0
      ? []
      : await db
          .select()
          .from(lessons)
          .where(
            inArray(
              lessons.sectionId,
              courseSections.map((s) => s.id),
            ),
          )
          .orderBy(asc(lessons.displayOrder));

  const session = await auth();
  let isEnrolled = false;
  if (session?.user) {
    const [row] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, session.user.id),
          eq(enrollments.courseId, course.id),
        ),
      )
      .limit(1);
    isEnrolled = Boolean(row);
  }

  const grouped = courseSections.map((s) => ({
    ...s,
    lessons: sectionLessons.filter((l) => l.sectionId === s.id),
  }));

  const totalLessons = sectionLessons.length;
  const totalMinutes = Math.round(
    sectionLessons.reduce((sum, l) => sum + (l.durationSec ?? 0), 0) / 60,
  );

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link
        href="/courses"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← All courses
      </Link>

      <header className="mt-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-2 text-neutral-600">{course.description}</p>
        )}
        <p className="mt-2 text-sm text-neutral-500">
          {totalLessons} lesson{totalLessons === 1 ? "" : "s"} · ~
          {totalMinutes} min
        </p>
      </header>

      <div className="mt-6">
        {!session?.user ? (
          <Link
            href={`/signin?callbackUrl=/courses/${course.slug}`}
            className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Sign in to enroll
          </Link>
        ) : isEnrolled ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              Enrolled
            </span>
            {sectionLessons[0] && (
              <Link
                href={`/courses/${course.slug}/${sectionLessons[0].id}`}
                className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Start watching →
              </Link>
            )}
          </div>
        ) : (
          <form action={enrollAction}>
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="slug" value={course.slug} />
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Enroll for free
            </button>
          </form>
        )}
      </div>

      <section className="mt-10 space-y-6">
        <h2 className="text-lg font-medium">Curriculum</h2>
        {grouped.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Curriculum coming soon.
          </p>
        ) : (
          grouped.map((section) => (
            <div key={section.id}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {section.title}
              </h3>
              <ol className="mt-2 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
                {section.lessons.map((lesson, i) => (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums text-neutral-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {isEnrolled ? (
                        <Link
                          href={`/courses/${course.slug}/${lesson.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-neutral-700">
                          {lesson.title}
                        </span>
                      )}
                    </div>
                    {lesson.durationSec ? (
                      <span className="text-xs text-neutral-500">
                        {Math.ceil(lesson.durationSec / 60)} min
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
