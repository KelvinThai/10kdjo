import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  certificates,
  enrollments,
  lessonProgress,
  lessons,
  sections,
} from "@/db/schema";

export type IssueResult = {
  issued: boolean;
  serial: string | null;
};

/**
 * Idempotent: if every lesson in the course is complete for this user and they
 * are enrolled, ensure a certificate row exists. Returns the serial of the
 * existing or newly-issued cert, or null when not yet eligible.
 */
export async function issueCertificateIfComplete(
  userId: string,
  courseId: number,
): Promise<IssueResult> {
  // Existing cert?
  const [existing] = await db
    .select({ serial: certificates.serial })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, userId),
        eq(certificates.courseId, courseId),
      ),
    )
    .limit(1);
  if (existing) return { issued: false, serial: existing.serial };

  // Enrolled?
  const [enr] = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId),
      ),
    )
    .limit(1);
  if (!enr) return { issued: false, serial: null };

  // Count total vs completed in one query
  const [counts] = await db
    .select({
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
    .where(eq(sections.courseId, courseId));

  const total = Number(counts?.total ?? 0);
  const completed = Number(counts?.completed ?? 0);
  if (total === 0 || completed < total) {
    return { issued: false, serial: null };
  }

  const serial = randomBytes(9).toString("base64url");

  const [inserted] = await db
    .insert(certificates)
    .values({ userId, courseId, serial })
    .onConflictDoNothing({
      target: [certificates.userId, certificates.courseId],
    })
    .returning({ serial: certificates.serial });

  if (inserted) return { issued: true, serial: inserted.serial };

  // Lost the race to a concurrent issuance — re-read
  const [row] = await db
    .select({ serial: certificates.serial })
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, userId),
        eq(certificates.courseId, courseId),
      ),
    )
    .limit(1);
  return { issued: false, serial: row?.serial ?? null };
}
