import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreditEditModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditEditModal({ user, open, onOpenChange }: CreditEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    action: "add",
    amount: "",
  });

  const creditMutation = useMutation({
    mutationFn: ({ userId, action, amount }: { userId: string; action: string; amount: number }) =>
      api.superadmin.updateUserCredits(userId, { action, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/credit-transactions"] });
      onOpenChange(false);
      setFormData({ action: "add", amount: "" });
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
    
    if (!user) return;

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="credit-edit-modal">
        <DialogHeader>
          <DialogTitle>Edit User Credits</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-foreground">User</Label>
            <div className="mt-2">
              <p className="text-foreground font-medium" data-testid="modal-user-name">
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="modal-user-email">
                {user.email}
              </p>
            </div>
          </div>
          
          <div>
            <Label className="text-foreground">Current Credits</Label>
            <p className="text-2xl font-bold text-primary mt-2" data-testid="modal-user-credits">
              {user.credits}
            </p>
          </div>
          
          <div>
            <Label htmlFor="credit-action">Action</Label>
            <Select value={formData.action} onValueChange={(value) => handleChange("action", value)}>
              <SelectTrigger className="mt-2" data-testid="select-credit-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Credits</SelectItem>
                <SelectItem value="remove">Remove Credits</SelectItem>
                <SelectItem value="set">Set Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="credit-amount">Amount</Label>
            <Input
              id="credit-amount"
              type="number"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="Enter amount"
              className="mt-2"
              required
              data-testid="input-credit-amount"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={creditMutation.isPending}
              data-testid="button-update-credits"
            >
              {creditMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Credits
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
