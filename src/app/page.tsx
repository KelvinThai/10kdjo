import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-8 p-12">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          10kdjo
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Learn to code, one video at a time.
        </h1>
        <p className="max-w-xl text-lg text-neutral-600">
          Self-paced programming courses with built-in quizzes, progress
          tracking, and a certificate when you finish.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {session ? (
          <>
            <Link
              href="/me"
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Go to dashboard
            </Link>
            <span className="text-sm text-neutral-500">
              Signed in as {session.user.email}
            </span>
          </>
        ) : (
          <>
            <Link
              href="/signin"
              className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Sign in
            </Link>
            <Link
              href="/courses"
              className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
            >
              Browse courses
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
