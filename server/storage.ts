import { users, leads, leadViews, creditTransactions, type User, type InsertUser, type Lead, type InsertLead, type LeadView, type InsertLeadView, type CreditTransaction, type InsertCreditTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(userId: string, credits: number): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Lead methods
  createLead(lead: InsertLead & { submittedBy: string }): Promise<Lead>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeadsByUser(userId: string): Promise<Lead[]>;
  getApprovedLeads(): Promise<(Lead & { submitter: User })[]>;
  getPendingLeads(): Promise<(Lead & { submitter: User })[]>;
  updateLeadStatus(id: string, status: "approved" | "rejected"): Promise<Lead>;
  getLeadsNotByUser(userId: string): Promise<(Lead & { submitter: User })[]>;

  // Lead view methods
  createLeadView(leadView: InsertLeadView): Promise<LeadView>;
  hasUserViewedLead(userId: string, leadId: string): Promise<boolean>;

  // Credit transaction methods
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  getCreditTransactions(): Promise<(CreditTransaction & { user: User; admin: User | null })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserCredits(userId: string, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createLead(leadData: InsertLead & { submittedBy: string }): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(leadData)
      .returning();
    return lead;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByUser(userId: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.submittedBy, userId))
      .orderBy(desc(leads.createdAt));
  }

  async getApprovedLeads(): Promise<(Lead & { submitter: User })[]> {
    return await db
      .select({
        id: leads.id,
        title: leads.title,
        description: leads.description,
        contact: leads.contact,
        category: leads.category,
        status: leads.status,
        submittedBy: leads.submittedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        submitter: users,
      })
      .from(leads)
      .innerJoin(users, eq(leads.submittedBy, users.id))
      .where(eq(leads.status, "approved"))
      .orderBy(desc(leads.createdAt));
  }

  async getPendingLeads(): Promise<(Lead & { submitter: User })[]> {
    return await db
      .select({
        id: leads.id,
        title: leads.title,
        description: leads.description,
        contact: leads.contact,
        category: leads.category,
        status: leads.status,
        submittedBy: leads.submittedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        submitter: users,
      })
      .from(leads)
      .innerJoin(users, eq(leads.submittedBy, users.id))
      .where(eq(leads.status, "pending"))
      .orderBy(desc(leads.createdAt));
  }

  async updateLeadStatus(id: string, status: "approved" | "rejected"): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ status, updatedAt: sql`now()` })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async getLeadsNotByUser(userId: string): Promise<(Lead & { submitter: User })[]> {
    return await db
      .select({
        id: leads.id,
        title: leads.title,
        description: leads.description,
        contact: leads.contact,
        category: leads.category,
        status: leads.status,
        submittedBy: leads.submittedBy,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        submitter: users,
      })
      .from(leads)
      .innerJoin(users, eq(leads.submittedBy, users.id))
      .where(and(eq(leads.status, "approved"), sql`${leads.submittedBy} != ${userId}`))
      .orderBy(desc(leads.createdAt));
  }

  async createLeadView(leadView: InsertLeadView): Promise<LeadView> {
    const [view] = await db
      .insert(leadViews)
      .values(leadView)
      .returning();
    return view;
  }

  async hasUserViewedLead(userId: string, leadId: string): Promise<boolean> {
    const [view] = await db
      .select()
      .from(leadViews)
      .where(and(eq(leadViews.viewedBy, userId), eq(leadViews.leadId, leadId)));
    return !!view;
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [trans] = await db
      .insert(creditTransactions)
      .values(transaction)
      .returning();
    return trans;
  }

  async getCreditTransactions(): Promise<(CreditTransaction & { user: User; admin: User | null })[]> {
    return await db
      .select({
        id: creditTransactions.id,
        userId: creditTransactions.userId,
        amount: creditTransactions.amount,
        type: creditTransactions.type,
        reason: creditTransactions.reason,
        adminId: creditTransactions.adminId,
        createdAt: creditTransactions.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          password: users.password,
          role: users.role,
          credits: users.credits,
          createdAt: users.createdAt,
        },
        admin: sql<User | null>`
          CASE 
            WHEN ${creditTransactions.adminId} IS NOT NULL 
            THEN row(admin_user.id, admin_user.name, admin_user.email, admin_user.password, admin_user.role, admin_user.credits, admin_user.created_at)::users
            ELSE NULL 
          END
        `,
      })
      .from(creditTransactions)
      .innerJoin(users, eq(creditTransactions.userId, users.id))
      .leftJoin(sql`users AS admin_user`, sql`admin_user.id = ${creditTransactions.adminId}`)
      .orderBy(desc(creditTransactions.createdAt));
  }
}

export const storage = new DatabaseStorage();
