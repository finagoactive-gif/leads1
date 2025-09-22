import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { authenticateToken, generateToken, requireRole, type AuthenticatedRequest } from "./middleware/auth";
import { loginSchema, registerSchema, insertLeadSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed superadmin user
  async function seedSuperadmin() {
    const superadminEmail = process.env.SUPERADMIN_EMAIL;
    const superadminPassword = process.env.SUPERADMIN_PASSWORD;
    
    if (superadminEmail && superadminPassword) {
      const existingUser = await storage.getUserByEmail(superadminEmail);
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(superadminPassword, 10);
        await storage.createUser({
          name: "Superadmin",
          email: superadminEmail,
          password: hashedPassword,
          role: "superadmin",
          credits: 1000,
        });
        console.log("Superadmin user created");
      }
    }
  }

  await seedSuperadmin();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        credits: user.credits,
      });

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          credits: user.credits 
        }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        credits: user.credits,
      });

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role, 
          credits: user.credits 
        }, 
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Lead routes
  app.post("/api/leads/submit", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertLeadSchema.parse(req.body);
      
      const lead = await storage.createLead({
        ...data,
        submittedBy: req.user!.id,
      });

      res.json({ lead });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leads/my", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const leads = await storage.getLeadsByUser(req.user!.id);
      res.json({ leads });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leads/all", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const leads = await storage.getLeadsNotByUser(req.user!.id);
      res.json({ leads });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/leads/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const leadId = req.params.id;
      const lead = await storage.getLeadById(leadId);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (lead.status !== "approved") {
        return res.status(403).json({ message: "Lead not approved" });
      }

      // Check if user is viewing their own lead
      if (lead.submittedBy === req.user!.id) {
        return res.json({ lead, cost: 0 });
      }

      // Check if user has already viewed this lead
      const hasViewed = await storage.hasUserViewedLead(req.user!.id, leadId);
      if (hasViewed) {
        return res.json({ lead, cost: 0 });
      }

      // Check if user has enough credits
      if (req.user!.credits < 1) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Deduct credit and record view
      const updatedUser = await storage.updateUserCredits(req.user!.id, req.user!.credits - 1);
      await storage.createLeadView({
        leadId,
        viewedBy: req.user!.id,
      });

      await storage.createCreditTransaction({
        userId: req.user!.id,
        amount: -1,
        type: "spend",
        reason: `Viewed lead: ${lead.title}`,
        adminId: null,
      });

      res.json({ lead, cost: 1, newCredits: updatedUser.credits });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-leads", authenticateToken, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const leads = await storage.getPendingLeads();
      res.json({ leads });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/leads/:id/approve", authenticateToken, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const leadId = req.params.id;
      const lead = await storage.updateLeadStatus(leadId, "approved");
      res.json({ lead });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/leads/:id/reject", authenticateToken, requireRole(["admin", "superadmin"]), async (req, res) => {
    try {
      const leadId = req.params.id;
      const lead = await storage.updateLeadStatus(leadId, "rejected");
      res.json({ lead });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Superadmin routes
  app.get("/api/superadmin/users", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/superadmin/create-admin", authenticateToken, requireRole(["superadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
      });

      const data = schema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        role: "admin",
        credits: 50,
      });

      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/superadmin/users/:id/credits", authenticateToken, requireRole(["superadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const schema = z.object({
        action: z.enum(["add", "remove", "set"]),
        amount: z.number().min(0),
      });

      const data = schema.parse(req.body);
      const userId = req.params.id;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let newCredits: number;
      let transactionAmount: number;
      let reason: string;

      switch (data.action) {
        case "add":
          newCredits = user.credits + data.amount;
          transactionAmount = data.amount;
          reason = `Credits added by admin`;
          break;
        case "remove":
          newCredits = Math.max(0, user.credits - data.amount);
          transactionAmount = -(data.amount);
          reason = `Credits removed by admin`;
          break;
        case "set":
          newCredits = data.amount;
          transactionAmount = data.amount - user.credits;
          reason = `Credits set to ${data.amount} by admin`;
          break;
      }

      const updatedUser = await storage.updateUserCredits(userId, newCredits);
      
      await storage.createCreditTransaction({
        userId,
        amount: transactionAmount,
        type: transactionAmount >= 0 ? "add" : "remove",
        reason,
        adminId: req.user!.id,
      });

      res.json({ user: updatedUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/superadmin/credit-transactions", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const transactions = await storage.getCreditTransactions();
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
