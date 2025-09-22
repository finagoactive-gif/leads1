import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CreditTransaction } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CreditManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    amount: "",
    action: "add",
  });

  const { data, isLoading, error } = useQuery<{ transactions: CreditTransaction[] }>({
    queryKey: ["/api/superadmin/credit-transactions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: usersData } = useQuery<{ users: any[] }>({
    queryKey: ["/api/superadmin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const creditMutation = useMutation({
    mutationFn: ({ userId, action, amount }: { userId: string; action: string; amount: number }) =>
      api.superadmin.updateUserCredits(userId, { action, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/credit-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      setFormData({ email: "", amount: "", action: "add" });
      toast({
        title: "Credits updated successfully",
        description: "User credits have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update credits",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = usersData?.users?.find(u => u.email === formData.email);
    if (!user) {
      toast({
        variant: "destructive",
        title: "User not found",
        description: "Please enter a valid email address.",
      });
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount < 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid positive number.",
      });
      return;
    }

    creditMutation.mutate({
      userId: user.id,
      action: formData.action,
      amount,
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "add":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "remove":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "spend":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "add":
        return "Credits Added";
      case "remove":
        return "Credits Removed";
      case "spend":
        return "Lead Viewed";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="credit-management-page">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" data-testid="credit-management-page">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load credit data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const transactions = data?.transactions || [];

  return (
    <div className="p-6" data-testid="credit-management-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Credit Management</h2>
        <p className="text-muted-foreground">Manage user credits and view credit transaction history.</p>
      </div>
      
      {/* Credit Assignment Form */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Assign Credits</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                required
                className="mt-1"
                data-testid="input-user-email"
              />
            </div>
            <div>
              <Label htmlFor="amount">Credits</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="25"
                required
                className="mt-1"
                data-testid="input-credit-amount"
              />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={formData.action} onValueChange={(value) => setFormData(prev => ({ ...prev, action: value }))}>
                <SelectTrigger className="mt-1" data-testid="select-credit-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Credits</SelectItem>
                  <SelectItem value="remove">Remove Credits</SelectItem>
                  <SelectItem value="set">Set Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                type="submit" 
                className="w-full"
                disabled={creditMutation.isPending}
                data-testid="button-apply-credits"
              >
                {creditMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Credit History */}
      <Card>
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Credit Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-foreground">User</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Action</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Credits</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Reason</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Date</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Admin</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-muted-foreground">
                    No credit transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border" data-testid={`transaction-row-${transaction.id}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground" data-testid={`transaction-user-name-${transaction.id}`}>
                            {transaction.user?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`transaction-user-email-${transaction.id}`}>
                            {transaction.user?.email || "unknown@example.com"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={getTransactionColor(transaction.type)} data-testid={`transaction-type-${transaction.id}`}>
                        {getTransactionLabel(transaction.type)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span 
                        className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        data-testid={`transaction-amount-${transaction.id}`}
                      >
                        {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground" data-testid={`transaction-reason-${transaction.id}`}>
                      {transaction.reason}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground" data-testid={`transaction-date-${transaction.id}`}>
                      {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                    </td>
                    <td className="py-4 px-6 text-muted-foreground" data-testid={`transaction-admin-${transaction.id}`}>
                      {transaction.admin?.name || "System"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
