export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  credits: number;
  createdAt?: string;
}

export interface Lead {
  id: string;
  title: string;
  description: string;
  contact: string;
  category: "technology" | "marketing" | "finance" | "healthcare" | "education" | "retail" | "other";
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  submitter?: User;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  reason: string;
  adminId: string | null;
  createdAt: string;
  user: User;
  admin: User | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  [key: string]: T;
}
