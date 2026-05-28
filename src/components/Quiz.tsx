import { and, asc, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { quizAttempts, quizQuestions, quizzes } from "@/db/schema";
import { QuizForm } from "./QuizForm";

export async function Quiz({ lessonId }: { lessonId: number }) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId))
    .limit(1);

  if (!quiz) return null;

  // Note: correctIndex is intentionally omitted so it never reaches the client.
  const questions = await db
    .select({
      id: quizQuestions.id,
      prompt: quizQuestions.prompt,
      choices: quizQuestions.choices,
    })
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.displayOrder));

  if (questions.length === 0) return null;

  const session = await auth();
  let lastAttempt: { scorePct: number; passed: boolean } | null = null;
  if (session?.user) {
    const [row] = await db
      .select({
        scorePct: quizAttempts.scorePct,
        passed: quizAttempts.passed,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, session.user.id),
          eq(quizAttempts.quizId, quiz.id),
        ),
      )
      .orderBy(desc(quizAttempts.attemptedAt))
      .limit(1);
    lastAttempt = row ?? null;
  }

  return (
    <QuizForm
      quizId={quiz.id}
      title={quiz.title}
      passScorePct={quiz.passScorePct}
      questions={questions}
      lastAttempt={lastAttempt}
    />
  );
}
