import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fatherName: text("father_name").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  city: text("city").notNull(),
  isWinner: boolean("is_winner").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const winners = pgTable("winners", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  wonAt: timestamp("won_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Submission = typeof submissions.$inferSelect;
export type Winner = typeof winners.$inferSelect;
