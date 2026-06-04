import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// Users
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  picture: text("picture"),
  passwordHash: text("password_hash"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  calendarSyncEnabled: boolean("calendar_sync_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type User = typeof usersTable.$inferSelect;

// Events
export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("00000000-0000-0000-0000-000000000000"),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule"),
  tag: text("tag"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type CalendarEvent = typeof eventsTable.$inferSelect;

// Tasks
export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("00000000-0000-0000-0000-000000000000"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  priority: text("priority").notNull().default("medium"),
  bucket: text("bucket").notNull().default("today"),
  category: text("category"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  estimatedMinutes: integer("estimated_minutes"),
  reminderChannel: text("reminder_channel"),
  repeatFrequency: text("repeat_frequency"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  parentTaskId: integer("parent_task_id"),
  recurrence: text("recurrence"), // "daily" | "weekly" | "monthly" | "weekdays" | null
  recurrenceEndDate: timestamp("recurrence_end_date", { withTimezone: true }),
  sharedWith: text("shared_with").array(),
  assignedTo: text("assigned_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Task = typeof tasksTable.$inferSelect;

// Reminders
export const remindersTable = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("00000000-0000-0000-0000-000000000000"),
  taskId: integer("task_id").notNull(),
  channel: text("channel").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("pending"),
  reminderType: text("reminder_type").notNull().default("one_time"),
  tone: text("tone").notNull().default("normal"),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Reminder = typeof remindersTable.$inferSelect;

// Conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("00000000-0000-0000-0000-000000000000"),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;

// Settings
export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("00000000-0000-0000-0000-000000000000").unique(),
  quietHoursStart: text("quiet_hours_start").notNull().default("22:00"),
  quietHoursEnd: text("quiet_hours_end").notNull().default("08:00"),
  reminderTone: text("reminder_tone").notNull().default("normal"),
  timezone: text("timezone").notNull().default("UTC"),
  pingFrequency: integer("ping_frequency").notNull().default(30),
  telegramChatId: text("telegram_chat_id"),
  telegramBotToken: text("telegram_bot_token"),
  discordWebhookUrl: text("discord_webhook_url"),
  hourlyUpdatesEnabled: boolean("hourly_updates_enabled").notNull().default(false),
  workdayStart: text("workday_start").notNull().default("09:00"),
  workdayEnd: text("workday_end").notNull().default("18:00"),
  focusModeEnabled: boolean("focus_mode_enabled").notNull().default(false),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  geminiApiKey: text("gemini_api_key"),
  openrouterApiKey: text("openrouter_api_key"),
  accentColor: text("accent_color").notNull().default("purple"),
  username: text("username").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Settings = typeof settingsTable.$inferSelect;

// Focus Sessions
export const focusSessionsTable = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: integer("task_id"),
  durationMinutes: integer("duration_minutes").notNull(),
  completedMinutes: integer("completed_minutes").notNull().default(0),
  status: text("status").notNull().default("active"), // "active" | "completed" | "cancelled"
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export type FocusSession = typeof focusSessionsTable.$inferSelect;

// Notifications
export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // "task_due" | "reminder" | "focus_complete" | "briefing" | "system"
  title: text("title").notNull(),
  body: text("body"),
  read: boolean("read").notNull().default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Notification = typeof notificationsTable.$inferSelect;

// Habits
export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull().default("daily"), // "daily" | "weekdays" | "weekly"
  color: text("color").notNull().default("primary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Habit = typeof habitsTable.$inferSelect;

export const habitLogsTable = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habitsTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type HabitLog = typeof habitLogsTable.$inferSelect;

// Reviews
export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  stats: text("stats"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Review = typeof reviewsTable.$inferSelect;

