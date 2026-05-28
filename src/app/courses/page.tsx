import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const list = await db
    .select()
    .from(courses)
    .where(eq(courses.published, true))
    .orderBy(asc(courses.displayOrder));

  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Home
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-1 text-neutral-600">
          Pick a course to start watching.
        </p>
      </header>

      {list.length === 0 ? (
        <p className="text-neutral-500">
          No courses published yet. Run <code>pnpm db:seed</code> to add
          samples.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.slug}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-900 hover:shadow-sm"
              >
                <h2 className="text-lg font-semibold">{course.title}</h2>
                {course.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                    {course.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
