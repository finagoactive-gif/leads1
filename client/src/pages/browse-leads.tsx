import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Lead } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadViewModal } from "@/components/modals/lead-view-modal";
import { Building, DollarSign, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BrowseLeads() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<{ leads: (Lead & { submitter: any })[] }>({
    queryKey: ["/api/leads/all"],
    queryFn: getQueryFn({ on401: "throw" }),
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

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6" data-testid="browse-leads-page">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" data-testid="browse-leads-page">
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
    <div className="p-6" data-testid="browse-leads-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Browse Leads</h2>
        <p className="text-muted-foreground">
          Discover valuable leads from the community. <span className="font-medium">1 credit per view</span>
        </p>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-40" data-testid="filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
              <Select defaultValue="newest">
                <SelectTrigger className="w-40" data-testid="filter-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="relevant">Most Relevant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Leads Grid */}
      {leads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No leads available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} data-testid={`lead-card-${lead.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`lead-title-${lead.id}`}>
                      {lead.title}
                    </h3>
                    <Badge className={getCategoryColor(lead.category)} data-testid={`lead-category-${lead.id}`}>
                      {lead.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {lead.submitter?.name || "Unknown"}
                    </p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {lead.description.substring(0, 200)}...
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span><Building className="w-4 h-4 mr-1 inline" />Company</span>
                    <span><DollarSign className="w-4 h-4 mr-1 inline" />Budget</span>
                    <span><Clock className="w-4 h-4 mr-1 inline" />Timeline</span>
                  </div>
                  <Button 
                    onClick={() => handleViewLead(lead)}
                    data-testid={`button-view-lead-${lead.id}`}
                  >
                    View Lead (1 Credit)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeadViewModal
        lead={selectedLead}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
