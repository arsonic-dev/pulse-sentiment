import { pgTable, text, timestamp, integer, uuid, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: text("id").primaryKey(), // Clerk user ID
    email: text("email").notNull().unique(),
    name: text("name"),
    plan: text("plan").default("free"), // 'free' | 'pro' | 'enterprise'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const analyses = pgTable("analyses", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    inputText: text("input_text").notNull(),
    charCount: integer("char_count"),
    source: text("source").default("dashboard"), // 'dashboard' | 'api' | 'batch'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const results = pgTable("results", {
    id: uuid("id").primaryKey().defaultRandom(),
    analysisId: uuid("analysis_id").references(() => analyses.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // 0-100
    confidence: integer("confidence").notNull(), // 0-100
    label: text("label").notNull(), // 'positive' | 'neutral' | 'negative'
    summary: text("summary"),
    emotions: jsonb("emotions").notNull().default({}),
    keywords: jsonb("keywords").notNull().default([]),
    sentences: jsonb("sentences").notNull().default([]),
    tokensUsed: integer("tokens_used"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(), // SHA-256 hash
    keyPrefix: text("key_prefix").notNull(), // First 8 chars
    callsToday: integer("calls_today").default(0),
    lastUsed: timestamp("last_used", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const usageLogs = pgTable("usage_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    analysisId: uuid("analysis_id").references(() => analyses.id, { onDelete: "set null" }),
    source: text("source"),
    tokensUsed: integer("tokens_used").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
