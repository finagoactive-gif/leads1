import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, DollarSign, Clock, MapPin, Coins, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LeadViewModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadViewModal({ lead, open, onOpenChange }: LeadViewModalProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const viewLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(`/api/leads/${leadId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.cost > 0 && user) {
        updateUser({
          ...user,
          credits: data.newCredits,
        });
        toast({
          title: "Lead viewed",
          description: `1 credit has been deducted. You now have ${data.newCredits} credits.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/leads/all"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to view lead",
        description: error.message,
      });
    },
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      technology: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      marketing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      finance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      healthcare: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
      education: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
      retail: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const handleViewLead = () => {
    if (!lead || !user) return;

    if (user.credits < 1) {
      toast({
        variant: "destructive",
        title: "Insufficient credits",
        description: "You need at least 1 credit to view this lead.",
      });
      return;
    }

    viewLeadMutation.mutate(lead.id);
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="lead-view-modal">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-2" data-testid="modal-lead-title">
              {lead.title}
            </h4>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={getCategoryColor(lead.category)} data-testid="modal-lead-category">
                {lead.category}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Posted by {lead.submitter?.name || "Unknown"}
              </span>
              <span className="text-sm text-muted-foreground" data-testid="modal-lead-time">
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-foreground mb-2">Description</h5>
            <p className="text-muted-foreground" data-testid="modal-lead-description">
              {lead.description}
            </p>
          </div>
          
          {viewLeadMutation.isSuccess && (
            <>
              <div>
                <h5 className="font-medium text-foreground mb-2">Contact Information</h5>
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <p className="text-foreground" data-testid="modal-lead-contact">
                      {lead.contact}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span><Building className="w-4 h-4 mr-1 inline" />Company</span>
                <span><DollarSign className="w-4 h-4 mr-1 inline" />Budget varies</span>
                <span><Clock className="w-4 h-4 mr-1 inline" />Timeline varies</span>
                <span><MapPin className="w-4 h-4 mr-1 inline" />Location varies</span>
              </div>
              
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Coins className="w-5 h-5" />
                    <span className="font-medium">
                      1 credit has been deducted from your account
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {!viewLeadMutation.isSuccess && (
            <div className="flex justify-center">
              <Button 
                onClick={handleViewLead}
                disabled={viewLeadMutation.isPending || (user ? user.credits < 1 : false)}
                data-testid="button-view-lead-details"
              >
                {viewLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                View Full Details (1 Credit)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
