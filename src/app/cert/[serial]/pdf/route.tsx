import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db";
import { certificates, courses, users } from "@/db/schema";
import { CertDoc } from "../CertDoc";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serial: string }> },
) {
  const { serial } = await params;

  const [row] = await db
    .select({
      serial: certificates.serial,
      issuedAt: certificates.issuedAt,
      courseTitle: courses.title,
      recipientName: users.name,
      recipientEmail: users.email,
    })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .innerJoin(users, eq(certificates.userId, users.id))
    .where(eq(certificates.serial, serial))
    .limit(1);

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const displayName = row.recipientName ?? row.recipientEmail ?? "Anonymous";
  const origin = new URL(req.url).origin;

  const buffer = await renderToBuffer(
    <CertDoc
      recipientName={displayName}
      courseTitle={row.courseTitle}
      issuedAt={row.issuedAt}
      serial={row.serial}
      verifyUrl={`${origin}/cert/${row.serial}`}
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="certificate-${row.serial}.pdf"`,
      "cache-control": "private, max-age=300",
    },
  });
}
