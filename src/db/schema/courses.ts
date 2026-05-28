import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  jsonb,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  published: boolean("published").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  youtubeId: text("youtube_id").notNull(),
  durationSec: integer("duration_sec"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const quizzes = pgTable(
  "quizzes",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    passScorePct: integer("pass_score_pct").notNull().default(70),
  },
  (t) => [uniqueIndex("quizzes_lesson_id_idx").on(t.lessonId)],
);

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  choices: jsonb("choices").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

export const enrollments = pgTable(
  "enrollments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    watchedSec: integer("watched_sec").notNull().default(0),
    completedAt: timestamp("completed_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  scorePct: integer("score_pct").notNull(),
  passed: boolean("passed").notNull(),
  attemptedAt: timestamp("attempted_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const certificates = pgTable(
  "certificates",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    serial: text("serial").notNull().unique(),
    issuedAt: timestamp("issued_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("certificates_user_course_idx").on(t.userId, t.courseId),
  ],
);
