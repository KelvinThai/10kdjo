"use server";

import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  enrollments,
  lessons,
  quizAttempts,
  quizQuestions,
  quizzes,
  sections,
} from "@/db/schema";

export type QuizResult = {
  questionId: number;
  userIndex: number;
  correctIndex: number;
};

export type QuizState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "done";
      scorePct: number;
      passed: boolean;
      results: QuizResult[];
    };

export async function submitQuizAction(
  _prev: QuizState,
  formData: FormData,
): Promise<QuizState> {
  const session = await auth();
  if (!session?.user) return { status: "error", error: "unauthorized" };

  const quizId = Number(formData.get("quizId"));
  if (!Number.isFinite(quizId)) {
    return { status: "error", error: "missing quiz" };
  }

  // Parse answers from formData: `q_<questionId>` → choiceIndex
  const answers = new Map<number, number>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^q_(\d+)$/);
    if (!m) continue;
    const qid = Number(m[1]);
    const choice = Number(value);
    if (Number.isFinite(qid) && Number.isFinite(choice)) {
      answers.set(qid, choice);
    }
  }

  // Look up quiz + parent lesson + course (to verify enrollment)
  const [quizRow] = await db
    .select({
      quizId: quizzes.id,
      passScorePct: quizzes.passScorePct,
      courseId: sections.courseId,
    })
    .from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .where(eq(quizzes.id, quizId))
    .limit(1);

  if (!quizRow) return { status: "error", error: "quiz not found" };

  const [enr] = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, session.user.id),
        eq(enrollments.courseId, quizRow.courseId),
      ),
    )
    .limit(1);
  if (!enr) return { status: "error", error: "not enrolled" };

  const questions = await db
    .select({
      id: quizQuestions.id,
      correctIndex: quizQuestions.correctIndex,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(asc(quizQuestions.displayOrder));

  if (questions.length === 0) {
    return { status: "error", error: "quiz has no questions" };
  }

  let correct = 0;
  const results: QuizResult[] = questions.map((q) => {
    const userIndex = answers.has(q.id) ? (answers.get(q.id) as number) : -1;
    if (userIndex === q.correctIndex) correct += 1;
    return {
      questionId: q.id,
      userIndex,
      correctIndex: q.correctIndex,
    };
  });

  const scorePct = Math.round((correct / questions.length) * 100);
  const passed = scorePct >= quizRow.passScorePct;

  await db.insert(quizAttempts).values({
    userId: session.user.id,
    quizId,
    scorePct,
    passed,
  });

  return { status: "done", scorePct, passed, results };
}
