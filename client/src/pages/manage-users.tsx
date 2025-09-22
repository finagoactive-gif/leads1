import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditEditModal } from "@/components/modals/credit-edit-modal";
import { Plus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ManageUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { data, isLoading, error } = useQuery<{ users: User[] }>({
    queryKey: ["/api/superadmin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: any) => api.superadmin.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      setCreateModalOpen(false);
      setCreateFormData({ name: "", email: "", password: "" });
      toast({
        title: "Admin created successfully",
        description: "New admin account has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create admin",
        description: error.message,
      });
    },
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "admin":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "user":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate(createFormData);
  };

  const handleEditCredits = (user: User) => {
    setSelectedUser(user);
    setCreditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="manage-users-page">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" data-testid="manage-users-page">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load users. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = data?.users || [];

  return (
    <div className="p-6" data-testid="manage-users-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Manage Users</h2>
          <p className="text-muted-foreground">Manage user accounts and create admin users.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-admin">
          <Plus className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-foreground">User</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Role</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Credits</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Joined</th>
                <th className="text-left py-3 px-6 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border" data-testid={`user-row-${user.id}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`user-name-${user.id}`}>
                          {user.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={getRoleColor(user.role)} data-testid={`user-role-${user.id}`}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-foreground font-medium" data-testid={`user-credits-${user.id}`}>
                    {user.credits}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground" data-testid={`user-joined-${user.id}`}>
                    {formatDistanceToNow(new Date(user.createdAt || Date.now()), { addSuffix: true })}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <Button
                        variant="link"
                        onClick={() => handleEditCredits(user)}
                        className="text-primary hover:text-primary/80 text-sm p-0"
                        data-testid={`button-edit-credits-${user.id}`}
                      >
                        Edit Credits
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Admin Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent data-testid="create-admin-modal">
          <DialogHeader>
            <DialogTitle>Create Admin User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                data-testid="input-admin-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                data-testid="input-admin-email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                data-testid="input-admin-password"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={createAdminMutation.isPending} data-testid="button-create-admin-submit">
                {createAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreditEditModal
        user={selectedUser}
        open={creditModalOpen}
        onOpenChange={setCreditModalOpen}
      />
    </div>
  );
}
