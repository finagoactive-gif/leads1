import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { Lead } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function MyLeads() {
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<{ leads: Lead[] }>({
    queryKey: ["/api/leads/my"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

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
      <div className="p-6" data-testid="my-leads-page">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" data-testid="my-leads-page">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load leads. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leads = data?.leads || [];

  return (
    <div className="p-6" data-testid="my-leads-page">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">My Leads</h2>
          <p className="text-muted-foreground">Manage your submitted leads.</p>
        </div>
        <Button onClick={() => setLocation("/submit-lead")} data-testid="button-submit-new-lead">
          <Plus className="mr-2 h-4 w-4" />
          Submit New Lead
        </Button>
      </div>
      
      {leads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">You haven't submitted any leads yet.</p>
            <Button onClick={() => setLocation("/submit-lead")} data-testid="button-submit-first-lead">
              <Plus className="mr-2 h-4 w-4" />
              Submit Your First Lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-foreground">Title</th>
                  <th className="text-left py-3 px-6 font-medium text-foreground">Category</th>
                  <th className="text-left py-3 px-6 font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-foreground">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border" data-testid={`lead-row-${lead.id}`}>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-foreground" data-testid={`lead-title-${lead.id}`}>
                          {lead.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lead.description.substring(0, 100)}...
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={getCategoryColor(lead.category)} data-testid={`lead-category-${lead.id}`}>
                        {lead.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={getStatusColor(lead.status)} data-testid={`lead-status-${lead.id}`}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground" data-testid={`lead-date-${lead.id}`}>
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
