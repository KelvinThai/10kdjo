import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { lessons, lessonProgress, enrollments, sections } from "@/db/schema";
import { issueCertificateIfComplete } from "@/lib/certificates";

const COMPLETE_THRESHOLD = 0.9;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  }

  const lessonId = Number((body as { lessonId?: unknown })?.lessonId);
  const watchedSec = Math.max(
    0,
    Math.floor(Number((body as { watchedSec?: unknown })?.watchedSec)),
  );

  if (!Number.isFinite(lessonId) || !Number.isFinite(watchedSec)) {
    return NextResponse.json({ error: "bad input" }, { status: 400 });
  }

  // Look up lesson + its course (via section) so we can check enrollment
  const [row] = await db
    .select({
      lessonId: lessons.id,
      durationSec: lessons.durationSec,
      courseId: sections.courseId,
    })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  }

  const [enr] = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, session.user.id),
        eq(enrollments.courseId, row.courseId),
      ),
    )
    .limit(1);

  if (!enr) {
    return NextResponse.json({ error: "not enrolled" }, { status: 403 });
  }

  const shouldComplete =
    row.durationSec != null &&
    watchedSec >= Math.floor(row.durationSec * COMPLETE_THRESHOLD);

  const now = new Date();

  const setClause: Record<string, unknown> = {
    watchedSec: sql`GREATEST(${lessonProgress.watchedSec}, ${watchedSec})`,
    updatedAt: now,
  };
  if (shouldComplete) {
    setClause.completedAt = sql`COALESCE(${lessonProgress.completedAt}, NOW())`;
  }

  await db
    .insert(lessonProgress)
    .values({
      userId: session.user.id,
      lessonId,
      watchedSec,
      completedAt: shouldComplete ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: setClause,
    });

  let certificateSerial: string | null = null;
  if (shouldComplete) {
    const result = await issueCertificateIfComplete(
      session.user.id,
      row.courseId,
    );
    certificateSerial = result.serial;
  }

  return NextResponse.json({
    ok: true,
    completed: shouldComplete,
    certificateSerial,
  });
}
