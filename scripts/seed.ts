import { db } from "@/db";
import {
  courses,
  sections,
  lessons,
  quizzes,
  quizQuestions,
  enrollments,
  lessonProgress,
  quizAttempts,
  certificates,
} from "@/db/schema";

// Placeholder YouTube ID — Rick Astley, the canonical "does the embed work" video.
// Swap with your real YouTube IDs (the 11-char string after `v=` in the URL).
const PLACEHOLDER_VIDEO = "dQw4w9WgXcQ";

async function main() {
  console.log("Seeding…");

  // Wipe in FK-safe order so reseeding is idempotent
  await db.delete(certificates);
  await db.delete(quizAttempts);
  await db.delete(lessonProgress);
  await db.delete(enrollments);
  await db.delete(quizQuestions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(sections);
  await db.delete(courses);

  // ─── Course 1: JavaScript ───────────────────────────────────────────
  const [jsCourse] = await db
    .insert(courses)
    .values({
      slug: "intro-to-javascript",
      title: "Intro to JavaScript",
      description:
        "Learn the fundamentals of JavaScript — variables, functions, control flow, and the DOM. Perfect for absolute beginners.",
      published: true,
      displayOrder: 0,
    })
    .returning();

  const [jsBasics] = await db
    .insert(sections)
    .values({ courseId: jsCourse.id, title: "JavaScript Basics", displayOrder: 0 })
    .returning();

  const [jsLesson1] = await db
    .insert(lessons)
    .values({
      sectionId: jsBasics.id,
      title: "What is JavaScript?",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 600,
      displayOrder: 0,
    })
    .returning();

  await db.insert(lessons).values([
    {
      sectionId: jsBasics.id,
      title: "Variables and types",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 720,
      displayOrder: 1,
    },
    {
      sectionId: jsBasics.id,
      title: "Functions and scope",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 540,
      displayOrder: 2,
    },
  ]);

  const [jsControl] = await db
    .insert(sections)
    .values({
      courseId: jsCourse.id,
      title: "Control flow",
      displayOrder: 1,
    })
    .returning();

  await db.insert(lessons).values([
    {
      sectionId: jsControl.id,
      title: "If / else and switch",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 480,
      displayOrder: 0,
    },
    {
      sectionId: jsControl.id,
      title: "Loops: for, while, for…of",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 600,
      displayOrder: 1,
    },
  ]);

  const [jsQuiz] = await db
    .insert(quizzes)
    .values({
      lessonId: jsLesson1.id,
      title: "JavaScript Basics — Quick Check",
      passScorePct: 70,
    })
    .returning();

  await db.insert(quizQuestions).values([
    {
      quizId: jsQuiz.id,
      prompt: "Which of these is NOT a primitive type in JavaScript?",
      choices: ["string", "number", "array", "boolean"],
      correctIndex: 2,
      displayOrder: 0,
    },
    {
      quizId: jsQuiz.id,
      prompt: "What does `typeof null` return?",
      choices: ["null", "undefined", "object", "string"],
      correctIndex: 2,
      displayOrder: 1,
    },
    {
      quizId: jsQuiz.id,
      prompt: "Which keyword declares a constant?",
      choices: ["var", "let", "const", "static"],
      correctIndex: 2,
      displayOrder: 2,
    },
  ]);

  // ─── Course 2: Python ───────────────────────────────────────────────
  const [pyCourse] = await db
    .insert(courses)
    .values({
      slug: "intro-to-python",
      title: "Intro to Python",
      description:
        "Get started with Python — syntax, data structures, and your first scripts.",
      published: true,
      displayOrder: 1,
    })
    .returning();

  const [pyBasics] = await db
    .insert(sections)
    .values({
      courseId: pyCourse.id,
      title: "Python Basics",
      displayOrder: 0,
    })
    .returning();

  await db.insert(lessons).values([
    {
      sectionId: pyBasics.id,
      title: "Installing Python",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 480,
      displayOrder: 0,
    },
    {
      sectionId: pyBasics.id,
      title: "Hello, world",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 360,
      displayOrder: 1,
    },
    {
      sectionId: pyBasics.id,
      title: "Lists and dictionaries",
      youtubeId: PLACEHOLDER_VIDEO,
      durationSec: 720,
      displayOrder: 2,
    },
  ]);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
