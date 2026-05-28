import { and, asc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { lessons, lessonProgress, sections } from "@/db/schema";

export type CourseProgress = {
  total: number;
  completed: number;
  pct: number;
};

/**
 * Returns a map of courseId → progress for the given user. Courses with no
 * lessons are returned as { total: 0, completed: 0, pct: 0 }. Courses the user
 * has no progress on still appear with completed=0.
 */
export async function getCourseProgress(
  userId: string,
  courseIds: number[],
): Promise<Map<number, CourseProgress>> {
  if (courseIds.length === 0) return new Map();

  const rows = await db
    .select({
      courseId: sections.courseId,
      total: sql<number>`COUNT(DISTINCT ${lessons.id})`,
      completed: sql<number>`COUNT(DISTINCT CASE WHEN ${lessonProgress.completedAt} IS NOT NULL THEN ${lessons.id} END)`,
    })
    .from(sections)
    .innerJoin(lessons, eq(lessons.sectionId, sections.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(inArray(sections.courseId, courseIds))
    .groupBy(sections.courseId);

  const map = new Map<number, CourseProgress>();
  for (const r of rows) {
    const total = Number(r.total);
    const completed = Number(r.completed);
    map.set(r.courseId, {
      total,
      completed,
      pct: total === 0 ? 0 : Math.round((completed / total) * 100),
    });
  }
  // Ensure every requested courseId has an entry (even with no lessons)
  for (const id of courseIds) {
    if (!map.has(id)) map.set(id, { total: 0, completed: 0, pct: 0 });
  }
  return map;
}

/**
 * Set of lesson IDs the user has completed within a single course.
 */
export async function getCompletedLessonIds(
  userId: string,
  courseId: number,
): Promise<Set<number>> {
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(sections.courseId, courseId),
        isNotNull(lessonProgress.completedAt),
      ),
    );
  return new Set(rows.map((r) => r.lessonId));
}

/**
 * First lesson in a course that the user has not completed, ordered by section
 * then lesson display order. Returns null when the course has no lessons or
 * every lesson is already completed.
 */
export async function getNextLessonId(
  userId: string,
  courseId: number,
): Promise<number | null> {
  const [row] = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId),
      ),
    )
    .where(
      and(eq(sections.courseId, courseId), isNull(lessonProgress.completedAt)),
    )
    .orderBy(asc(sections.displayOrder), asc(lessons.displayOrder))
    .limit(1);

  return row?.id ?? null;
}
