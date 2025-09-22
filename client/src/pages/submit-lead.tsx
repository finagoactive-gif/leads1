import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Loader2 } from "lucide-react";

export default function SubmitLead() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    contact: "",
  });

  const submitLeadMutation = useMutation({
    mutationFn: (data: any) => api.leads.submit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/my"] });
      toast({
        title: "Lead submitted successfully!",
        description: "Your lead is now pending review.",
      });
      setLocation("/my-leads");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to submit lead",
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({
        variant: "destructive",
        title: "Please select a category",
      });
      return;
    }
    submitLeadMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value,
    }));
  };

  return (
    <div className="p-6" data-testid="submit-lead-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Submit New Lead</h2>
        <p className="text-muted-foreground">Share a valuable lead with the community.</p>
      </div>
      
      <div className="max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-foreground">Lead Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., E-commerce Startup Looking for Marketing Partner"
                  className="mt-2"
                  data-testid="input-title"
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-foreground">Category *</Label>
                <Select onValueChange={handleCategoryChange} required>
                  <SelectTrigger className="mt-2" data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="description" className="text-foreground">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about the lead, including company size, budget, timeline, and specific requirements..."
                  className="mt-2"
                  data-testid="textarea-description"
                />
              </div>
              
              <div>
                <Label htmlFor="contact" className="text-foreground">Contact Information *</Label>
                <Input
                  id="contact"
                  name="contact"
                  required
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Contact email or phone number"
                  className="mt-2"
                  data-testid="input-contact"
                />
              </div>
              
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="text-primary mt-0.5 w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Submission Guidelines</p>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• Submitting leads is free and doesn't require credits</li>
                        <li>• All leads are reviewed before being approved</li>
                        <li>• Provide accurate and detailed information</li>
                        <li>• Quality leads earn you community recognition</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  disabled={submitLeadMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitLeadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Lead
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
