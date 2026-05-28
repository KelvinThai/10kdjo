import { db } from "@/db";
import { courses } from "@/db/schema";

async function main() {
  console.log("Seeding…");

  await db
    .insert(courses)
    .values({
      slug: "hello-world",
      title: "Hello, World",
      description:
        "A placeholder course to verify the platform end-to-end. Replace with real content once the catalog UI lands.",
      published: true,
      displayOrder: 0,
    })
    .onConflictDoNothing();

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
