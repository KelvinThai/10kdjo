"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  submitQuizAction,
  type QuizState,
} from "@/app/courses/[slug]/[lessonId]/actions";

export type QuizQuestionForClient = {
  id: number;
  prompt: string;
  choices: string[];
};

type Props = {
  quizId: number;
  title: string;
  passScorePct: number;
  questions: QuizQuestionForClient[];
  lastAttempt: { scorePct: number; passed: boolean } | null;
};

const initialState: QuizState = { status: "idle" };

export function QuizForm({
  quizId,
  title,
  passScorePct,
  questions,
  lastAttempt,
}: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    submitQuizAction,
    initialState,
  );

  const showResults = state.status === "done";

  const resultsByQuestion =
    state.status === "done"
      ? new Map(state.results.map((r) => [r.questionId, r]))
      : null;

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-neutral-500">
          Pass: {passScorePct}%
        </span>
      </header>

      {lastAttempt && !showResults && (
        <p className="mt-2 text-sm text-neutral-600">
          Last attempt:{" "}
          <span className="font-medium">{lastAttempt.scorePct}%</span>
          {" — "}
          {lastAttempt.passed ? (
            <span className="text-emerald-700">passed</span>
          ) : (
            <span className="text-red-700">failed</span>
          )}
        </p>
      )}

      {state.status === "error" && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {showResults && state.status === "done" && (
        <div
          className={`mt-3 rounded-lg px-4 py-3 text-sm font-medium ${
            state.passed
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {state.passed ? "Passed" : "Not yet"} · {state.scorePct}%
        </div>
      )}

      <form action={formAction} className="mt-5 space-y-5">
        <input type="hidden" name="quizId" value={quizId} />

        {questions.map((q, qIdx) => {
          const result = resultsByQuestion?.get(q.id);
          return (
            <fieldset
              key={q.id}
              className="space-y-2"
              disabled={isPending || showResults}
            >
              <legend className="text-sm font-medium">
                {qIdx + 1}. {q.prompt}
              </legend>
              <div className="space-y-1.5">
                {q.choices.map((choice, cIdx) => {
                  let stateStyle = "";
                  if (result) {
                    if (cIdx === result.correctIndex) {
                      stateStyle =
                        "bg-emerald-50 border-emerald-300 text-emerald-900";
                    } else if (cIdx === result.userIndex) {
                      stateStyle = "bg-red-50 border-red-300 text-red-900";
                    } else {
                      stateStyle = "opacity-60";
                    }
                  }
                  return (
                    <label
                      key={cIdx}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm transition hover:border-neutral-400 ${stateStyle}`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={cIdx}
                        required={!showResults}
                        className="h-4 w-4"
                      />
                      <span>{choice}</span>
                      {result && cIdx === result.correctIndex && (
                        <span aria-hidden className="ml-auto text-emerald-700">
                          ✓
                        </span>
                      )}
                      {result &&
                        cIdx === result.userIndex &&
                        cIdx !== result.correctIndex && (
                          <span aria-hidden className="ml-auto text-red-700">
                            ✗
                          </span>
                        )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="flex items-center gap-3 pt-2">
          {!showResults ? (
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Submitting…" : "Submit answers"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Retake
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
