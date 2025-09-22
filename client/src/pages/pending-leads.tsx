import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PendingLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ leads: (Lead & { submitter: any })[] }>({
    queryKey: ["/api/admin/pending-leads"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const approveMutation = useMutation({
    mutationFn: (leadId: string) => api.admin.approveLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-leads"] });
      toast({
        title: "Lead approved",
        description: "The lead has been approved and is now visible to users.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to approve lead",
        description: error.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (leadId: string) => api.admin.rejectLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-leads"] });
      toast({
        title: "Lead rejected",
        description: "The lead has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to reject lead",
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

  if (isLoading) {
    return (
      <div className="p-6" data-testid="pending-leads-page">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" data-testid="pending-leads-page">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load pending leads. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leads = data?.leads || [];

  return (
    <div className="p-6" data-testid="pending-leads-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Pending Leads</h2>
        <p className="text-muted-foreground">Review and approve leads submitted by users.</p>
      </div>
      
      {leads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No pending leads to review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {leads.map((lead) => (
            <Card key={lead.id} data-testid={`pending-lead-${lead.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`lead-title-${lead.id}`}>
                      {lead.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>
                        <User className="w-4 h-4 mr-1 inline" />
                        Submitted by {lead.submitter?.name || "Unknown"}
                      </span>
                      <span>
                        <Calendar className="w-4 h-4 mr-1 inline" />
                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                      </span>
                      <Badge className={getCategoryColor(lead.category)} data-testid={`lead-category-${lead.id}`}>
                        {lead.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                    Pending Review
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Description:</h4>
                  <p className="text-muted-foreground" data-testid={`lead-description-${lead.id}`}>
                    {lead.description}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Contact Information:</h4>
                  <p className="text-muted-foreground" data-testid={`lead-contact-${lead.id}`}>
                    {lead.contact}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => approveMutation.mutate(lead.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    data-testid={`button-approve-${lead.id}`}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(lead.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    variant="destructive"
                    data-testid={`button-reject-${lead.id}`}
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
