import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { certificates, courses, enrollments } from "@/db/schema";
import { ProgressBar } from "@/components/ProgressBar";
import { getCourseProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const enrolled = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, session.user.id))
    .orderBy(desc(enrollments.enrolledAt));

  const progress = await getCourseProgress(
    session.user.id,
    enrolled.map((c) => c.id),
  );

  const userCerts = await db
    .select({
      serial: certificates.serial,
      issuedAt: certificates.issuedAt,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(eq(certificates.userId, session.user.id))
    .orderBy(desc(certificates.issuedAt));

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My learning</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Signed in as {session.user.email}
            {session.user.role === "admin" && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                admin
              </span>
            )}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Enrolled courses</h2>

        {enrolled.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">
            You haven&apos;t enrolled in anything yet.{" "}
            <Link
              href="/courses"
              className="font-medium text-neutral-900 underline"
            >
              Browse courses →
            </Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {enrolled.map((c) => {
              const p = progress.get(c.id);
              return (
                <li key={c.id}>
                  <Link
                    href={`/courses/${c.slug}`}
                    className="block rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-900"
                  >
                    <h3 className="text-base font-semibold">{c.title}</h3>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {c.description}
                      </p>
                    )}
                    {p && p.total > 0 && (
                      <ProgressBar
                        completed={p.completed}
                        total={p.total}
                        pct={p.pct}
                        className="mt-3"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {userCerts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-medium">Certificates</h2>
          <ul className="mt-3 space-y-2">
            {userCerts.map((c) => (
              <li
                key={c.serial}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{c.courseTitle}</p>
                  <p className="text-xs text-neutral-500">
                    Issued{" "}
                    {c.issuedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · #{c.serial}
                  </p>
                </div>
                <Link
                  href={`/cert/${c.serial}`}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
                >
                  View →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
