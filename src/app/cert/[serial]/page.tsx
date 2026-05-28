import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, courses, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  const [row] = await db
    .select({
      serial: certificates.serial,
      issuedAt: certificates.issuedAt,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      recipientName: users.name,
      recipientEmail: users.email,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(users, eq(certificates.userId, users.id))
    .where(eq(certificates.serial, serial))
    .limit(1);

  if (!row) notFound();

  const displayName = row.recipientName ?? row.recipientEmail ?? "Anonymous";
  const issued = row.issuedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl p-6 sm:p-10">
      <Link
        href="/"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← 10kdjo
      </Link>

      <article className="mt-4 overflow-hidden rounded-2xl border border-neutral-900 bg-white">
        <div className="m-3 rounded-xl border border-neutral-300 p-10 sm:p-14">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.4em] text-neutral-400">
              10KDJO
            </p>
            <p className="mt-4 text-xs tracking-[0.2em] text-neutral-500">
              CERTIFICATE OF COMPLETION
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Certificate of Completion
            </h1>

            <p className="mt-8 text-sm text-neutral-600">This certifies that</p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl">
              {displayName}
            </p>
            <div className="mx-auto mt-3 h-px w-56 bg-neutral-900" />

            <p className="mt-6 text-sm text-neutral-600">
              has successfully completed
            </p>
            <p className="mt-2 text-lg font-semibold sm:text-xl">
              {row.courseTitle}
            </p>
          </div>

          <div className="mt-12 flex items-end justify-between text-xs">
            <div>
              <p className="font-medium tracking-widest text-neutral-400">
                ISSUED
              </p>
              <p className="mt-1 font-semibold">{issued}</p>
            </div>
            <div className="text-right">
              <p className="font-medium tracking-widest text-neutral-400">
                SERIAL
              </p>
              <p className="mt-1 font-semibold">{row.serial}</p>
            </div>
          </div>
        </div>
      </article>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/cert/${row.serial}/pdf`}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Download PDF
        </a>
        <Link
          href={`/courses/${row.courseSlug}`}
          className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          View course
        </Link>
      </div>
    </main>
  );
}
