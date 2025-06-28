"use client";

import { useState, useMemo, useEffect } from "react";
import { CandidateCard } from "./CandidateCard";
import { CandidateFilters } from "./CandidateFilters";
import type { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Mail, ChevronDown, XCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";


type CandidateGridProps = {
    candidates: Candidate[];
};

export function CandidateGrid({ candidates: initialCandidates }: CandidateGridProps) {
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [company, setCompany] = useState("all");
  const [experience, setExperience] = useState("all");
  const [role, setRole] = useState("all");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Reset filters and candidates when the initial list changes
    setFilteredCandidates(initialCandidates);
    setCompany("all");
    setExperience("all");
    setRole("all");
    setSelectedCandidates([]);
  }, [initialCandidates]);

  const availableCompanies = useMemo(() => {
    const companies = new Set(initialCandidates.flatMap(c => c.targetCompanies));
    return Array.from(companies).sort();
  }, [initialCandidates]);

  const isFiltered = useMemo(() => {
    return company !== "all" || experience !== "all" || role !== "all";
  }, [company, experience, role]);

  const handleApplyFilters = () => {
    let candidates = [...initialCandidates];

    if (company !== "all") {
      candidates = candidates.filter(c => c.targetCompanies.includes(company));
    }

    if (experience !== "all") {
      switch (experience) {
        case '0-2':
          candidates = candidates.filter(c => c.experience >= 0 && c.experience <= 2);
          break;
        case '3-5':
          candidates = candidates.filter(c => c.experience >= 3 && c.experience <= 5);
          break;
        case '5+':
          candidates = candidates.filter(c => c.experience > 5);
          break;
      }
    }

    if (role !== "all") {
      const roleKeywords: Record<string, string[]> = {
          'frontend': ['frontend'],
          'product-manager': ['product manager'],
          'designer': ['designer']
      };
      if (roleKeywords[role]) {
        candidates = candidates.filter(c => 
            roleKeywords[role].some(keyword => c.role.toLowerCase().includes(keyword))
        );
      }
    }
    
    setFilteredCandidates(candidates);
    setSelectedCandidates([]); // Clear selection on new filter
  };

  const handleClearFilters = () => {
    setCompany("all");
    setExperience("all");
    setRole("all");
    setFilteredCandidates(initialCandidates);
    setSelectedCandidates([]); // Clear selection on clear filters
  };

  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleBulkDownload = () => {
    if (selectedCandidates.length === 0) return;
    toast({
        title: "Download Started",
        description: `Preparing resumes for ${selectedCandidates.length} candidate(s).`
    });
    setIsActionDialogOpen(false);
    setSelectedCandidates([]);
  };

  const handleBulkEmail = () => {
    if (selectedCandidates.length === 0) return;
    toast({
        title: "Email Sent",
        description: `${selectedCandidates.length} resume(s) have been sent to your email.`
    });
    setIsActionDialogOpen(false);
    setSelectedCandidates([]);
  };

  const handleCancelRequest = () => {
    if (selectedCandidates.length === 0) return;
    if (!cancelReason.trim()) {
        toast({
            title: "Reason Required",
            description: "Please provide a reason for cancelling the request(s).",
            variant: "destructive",
        });
        return;
    }
    toast({
        title: "Request(s) Cancelled",
        description: `${selectedCandidates.length} candidate request(s) have been cancelled.`
    });
    setIsCancelDialogOpen(false);
    setSelectedCandidates([]);
    setCancelReason("");
  };

  return (
    <>
      <CandidateFilters 
        company={company}
        setCompany={setCompany}
        availableCompanies={availableCompanies}
        experience={experience}
        setExperience={setExperience}
        role={role}
        setRole={setRole}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      
      <div className="flex items-center justify-start min-h-[40px] -mb-2">
        {selectedCandidates.length > 0 && (
          <div className="flex items-center gap-4 p-2 rounded-lg bg-muted">
              <span className="text-sm text-muted-foreground font-medium pl-2">
                {selectedCandidates.length} candidate(s) selected
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setIsActionDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download/Share Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsCancelDialogOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Request
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCandidates([])}
              >
                  Clear selection
              </Button>
            </div>
        )}
      </div>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Resume Actions</DialogTitle>
                <DialogDescription>
                    You have selected {selectedCandidates.length} candidate(s). Choose how you would like to handle their resumes.
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button variant="outline" onClick={handleBulkDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download to Device
                </Button>
                <Button onClick={handleBulkEmail} className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Share via Email
                </Button>
            </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCancelDialogOpen} onOpenChange={(open) => { if (!open) setCancelReason(''); setIsCancelDialogOpen(open);}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Cancel Referral Request</DialogTitle>
                <DialogDescription>
                    You are about to cancel the request for {selectedCandidates.length} candidate(s). Please provide a reason below. This will be shared with the candidate.
                </DialogDescription>
            </DialogHeader>
            <div className="py-2">
                <Label htmlFor="cancel-reason" className="sr-only">Reason for Cancellation</Label>
                <Textarea
                    id="cancel-reason"
                    placeholder="e.g., Position has been filled, not a good fit for the current openings..."
                    className="mt-2 min-h-[100px]"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsCancelDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleCancelRequest}>
                    <Send className="mr-2 h-4 w-4" />
                    Confirm Cancellation
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCandidates.length > 0 ? (
            filteredCandidates.map(candidate => (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate}
                isSelected={selectedCandidates.includes(candidate.id)}
                onSelect={toggleCandidateSelection}
              />
            ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground py-10">
                No candidates match your criteria.
            </div>
        )}
      </div>
    </>
  );
}
