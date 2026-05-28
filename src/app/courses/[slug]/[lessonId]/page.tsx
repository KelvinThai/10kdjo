import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  courses,
  enrollments,
  lessonProgress,
  lessons,
  sections,
} from "@/db/schema";
import { LessonPlayer } from "@/components/LessonPlayer";
import { Quiz } from "@/components/Quiz";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId: lessonIdRaw } = await params;
  const lessonId = Number(lessonIdRaw);
  if (!Number.isFinite(lessonId)) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(`/signin?callbackUrl=/courses/${slug}/${lessonIdRaw}`);
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, slug))
    .limit(1);
  if (!course || !course.published) notFound();

  const [enr] = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, session.user.id),
        eq(enrollments.courseId, course.id),
      ),
    )
    .limit(1);
  if (!enr) redirect(`/courses/${slug}`);

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!lesson) notFound();

  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, lesson.sectionId))
    .limit(1);
  if (!section || section.courseId !== course.id) notFound();

  // Prev/next ordering — load all sections + lessons for this course
  const courseSections = await db
    .select()
    .from(sections)
    .where(eq(sections.courseId, course.id))
    .orderBy(asc(sections.displayOrder));

  const allLessons = await db
    .select()
    .from(lessons)
    .where(
      inArray(
        lessons.sectionId,
        courseSections.map((s) => s.id),
      ),
    )
    .orderBy(asc(lessons.displayOrder));

  const sectionOrder = new Map(
    courseSections.map((s) => [s.id, s.displayOrder]),
  );
  const ordered = [...allLessons].sort((a, b) => {
    const sa = sectionOrder.get(a.sectionId) ?? 0;
    const sb = sectionOrder.get(b.sectionId) ?? 0;
    if (sa !== sb) return sa - sb;
    return a.displayOrder - b.displayOrder;
  });

  const currentIdx = ordered.findIndex((l) => l.id === lesson.id);
  const prev = currentIdx > 0 ? ordered[currentIdx - 1] : null;
  const next =
    currentIdx >= 0 && currentIdx < ordered.length - 1
      ? ordered[currentIdx + 1]
      : null;

  const [progress] = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, session.user.id),
        eq(lessonProgress.lessonId, lesson.id),
      ),
    )
    .limit(1);

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8">
      <nav className="text-sm text-neutral-500">
        <Link href="/courses" className="hover:text-neutral-900">
          Courses
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/courses/${course.slug}`}
          className="hover:text-neutral-900"
        >
          {course.title}
        </Link>
      </nav>

      <header className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {section.title}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
      </header>

      <div className="mt-6">
        <LessonPlayer
          lessonId={lesson.id}
          youtubeId={lesson.youtubeId}
          durationSec={lesson.durationSec}
          initialWatchedSec={progress?.watchedSec ?? 0}
          alreadyCompleted={Boolean(progress?.completedAt)}
        />
      </div>

      <Quiz lessonId={lesson.id} />

      <nav className="mt-10 flex items-center justify-between gap-3">
        {prev ? (
          <Link
            href={`/courses/${course.slug}/${prev.id}`}
            className="flex-1 truncate rounded-lg border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            href={`/courses/${course.slug}/${next.id}`}
            className="flex-1 truncate rounded-lg bg-neutral-900 px-4 py-2 text-right text-sm font-medium text-white hover:bg-neutral-800"
          >
            Next: {next.title} →
          </Link>
        ) : (
          <span className="flex-1 text-right text-sm text-neutral-500">
            End of course
          </span>
        )}
      </nav>
    </main>
  );
}
