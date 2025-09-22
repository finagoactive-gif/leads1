import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["user", "admin", "superadmin"]);
export const leadStatusEnum = pgEnum("lead_status", ["pending", "approved", "rejected"]);
export const categoryEnum = pgEnum("category", ["technology", "marketing", "finance", "healthcare", "education", "retail", "other"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("user"),
  credits: integer("credits").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contact: text("contact").notNull(),
  category: categoryEnum("category").notNull(),
  status: leadStatusEnum("status").notNull().default("pending"),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const leadViews = pgTable("lead_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  viewedBy: varchar("viewed_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // "add", "remove", "spend"
  reason: text("reason").notNull(),
  adminId: varchar("admin_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  submittedLeads: many(leads),
  leadViews: many(leadViews),
  creditTransactions: many(creditTransactions),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  submitter: one(users, {
    fields: [leads.submittedBy],
    references: [users.id],
  }),
  views: many(leadViews),
}));

export const leadViewsRelations = relations(leadViews, ({ one }) => ({
  lead: one(leads, {
    fields: [leadViews.leadId],
    references: [leads.id],
  }),
  viewer: one(users, {
    fields: [leadViews.viewedBy],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [creditTransactions.adminId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  status: true,
  submittedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadViewSchema = createInsertSchema(leadViews).omit({
  id: true,
  createdAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadView = typeof leadViews.$inferSelect;
export type InsertLeadView = z.infer<typeof insertLeadViewSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
