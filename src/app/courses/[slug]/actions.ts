"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { enrollments } from "@/db/schema";

export async function enrollAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const courseId = Number(formData.get("courseId"));
  const slug = String(formData.get("slug"));

  if (!Number.isFinite(courseId) || !slug) {
    return;
  }

  await db
    .insert(enrollments)
    .values({ userId: session.user.id, courseId })
    .onConflictDoNothing();

  revalidatePath(`/courses/${slug}`);
}
