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
  accessLevel: text("access_level").notNull().default("user"),
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
  telegramUsername: text("telegram_username"),
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
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
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

export const watchProgressTable = pgTable("watch_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  animeId: text("anime_id").notNull(),
  animeTitle: text("anime_title"),
  episode: text("episode").notNull(),
  position: integer("position").default(0),
  duration: integer("duration").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type WatchProgress = typeof watchProgressTable.$inferSelect;

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

// Media Ratings
export const mediaRatingsTable = pgTable("media_ratings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mediaId: text("media_id").notNull(),
  mediaTitle: text("media_title"),
  rating: integer("rating").notNull(),
  isLiked: boolean("is_liked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type MediaRating = typeof mediaRatingsTable.$inferSelect;

// Search Activity
export const searchActivityTable = pgTable("search_activity", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  searchQuery: text("search_query"),
  clickedMediaId: text("clicked_media_id"),
  clickedMediaTitle: text("clicked_media_title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type SearchActivity = typeof searchActivityTable.$inferSelect;

// User Profiles for Recommendations
export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  age: integer("age"),
  country: text("country"),
  favoriteGenres: text("favorite_genres").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type UserProfile = typeof userProfilesTable.$inferSelect;

// Media Catalog
export const mediaCatalogTable = pgTable("media_catalog", {
  id: serial("id").primaryKey(),
  mediaId: text("media_id").notNull().unique(), // e.g. 'tmdb:123' or 'anilist:456'
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre"), // Primary genre
  tags: text("tags"), // Comma-separated or stringified JSON
  type: text("type").notNull(), // 'anime' or 'tv'
  coverImage: text("cover_image"),
  bannerImage: text("banner_image"),
  releaseDate: timestamp("release_date", { withTimezone: true }),
  episodes: integer("episodes"),
  averageScore: integer("average_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type MediaCatalog = typeof mediaCatalogTable.$inferSelect;

// --- Chief Planner ---
export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Goal = typeof goalsTable.$inferSelect;

export const roadmapsTable = pgTable("roadmaps", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goalsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Roadmap = typeof roadmapsTable.$inferSelect;

export const milestonesTable = pgTable("milestones", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id").notNull().references(() => roadmapsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Milestone = typeof milestonesTable.$inferSelect;


// --- Attendance Tracker ---
export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  targetPercentage: integer("target_percentage").notNull().default(75),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Subject = typeof subjectsTable.$inferSelect;

export const attendanceLogsTable = pgTable("attendance_logs", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull(), // 'present' | 'absent' | 'cancelled'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type AttendanceLog = typeof attendanceLogsTable.$inferSelect;

// --- Family System ---
export const familiesTable = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: text("creator_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Family = typeof familiesTable.$inferSelect;

export const familyMembersTable = pgTable("family_members", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => familiesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("member"), // 'admin', 'member'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type FamilyMember = typeof familyMembersTable.$inferSelect;

// --- Diet & Meal Planner ---
export const dietGoalsTable = pgTable("diet_goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  targetCalories: integer("target_calories").notNull().default(2000),
  targetProtein: integer("target_protein").notNull().default(150),
  targetCarbs: integer("target_carbs").notNull().default(200),
  targetFat: integer("target_fat").notNull().default(65),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type DietGoal = typeof dietGoalsTable.$inferSelect;

export const mealLogsTable = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  mealType: text("meal_type").notNull(), // Breakfast, Lunch, Dinner, Snack
  foodItems: text("food_items"), // JSON array of strings
  calories: integer("calories").notNull().default(0),
  protein: integer("protein").notNull().default(0),
  carbs: integer("carbs").notNull().default(0),
  fat: integer("fat").notNull().default(0),
  imageUrl: text("image_url"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});
export type MealLog = typeof mealLogsTable.$inferSelect;

// --- Life Chronicle Games ---
export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  achievementKey: text("achievement_key").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  rarity: text("rarity").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});
export type Achievement = typeof achievementsTable.$inferSelect;

export const leaderboardTable = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  playerName: text("player_name").notNull(),
  characterName: text("character_name").notNull(),
  realm: text("realm").notNull(),
  bloodline: text("bloodline").notNull(),
  legacyScore: integer("legacy_score").notNull(),
  lifespan: integer("lifespan").notNull(),
  cause: text("cause").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type LeaderboardEntry = typeof leaderboardTable.$inferSelect;

export const saveSlotsTable = pgTable("save_slots", {
  id: serial("id").primaryKey(),
  playerId: text("player_id").notNull(),
  slotName: text("slot_name").notNull(),
  characterName: text("character_name").notNull(),
  age: integer("age").notNull().default(0),
  realm: text("realm").notNull().default("mortal"),
  bloodline: text("bloodline").notNull().default("common"),
  wealth: integer("wealth").notNull().default(0),
  legacyScore: integer("legacy_score").notNull().default(0),
  gameStateJson: text("game_state_json").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type SaveSlot = typeof saveSlotsTable.$inferSelect;

// --- Agentic Features ---
export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  lastContactDate: timestamp("last_contact_date", { withTimezone: true }),
  birthday: timestamp("birthday", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Contact = typeof contactsTable.$inferSelect;

export const researchTable = pgTable("research", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  query: text("query").notNull(),
  reportMarkdown: text("report_markdown"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Research = typeof researchTable.$inferSelect;

export const draftsTable = pgTable("drafts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  channel: text("channel").notNull(), // 'whatsapp' | 'email'
  recipient: text("recipient").notNull(),
  messageContent: text("message_content").notNull(),
  status: text("status").notNull().default("pending_approval"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Draft = typeof draftsTable.$inferSelect;
