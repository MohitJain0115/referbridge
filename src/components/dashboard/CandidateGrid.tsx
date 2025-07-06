
"use client";

import { useState, useMemo, useEffect } from "react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CandidateCard } from "./CandidateCard";
import { CandidateFilters } from "./CandidateFilters";
import type { Candidate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Mail, ChevronDown, XCircle, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db, firebaseReady, auth } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";


type CandidateGridProps = {
    candidates: Candidate[];
    showCancelAction?: boolean;
};

export function CandidateGrid({ candidates: initialCandidates, showCancelAction = false }: CandidateGridProps) {
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("all");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Candidate['status'] | 'all'>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReasonText, setOtherReasonText] = useState("");
  const { toast } = useToast();

  const handleSelectAllToggle = () => {
    const allVisibleCandidates = filteredCandidates.slice(0, 20);
    const allVisibleIds = allVisibleCandidates.map(c => c.id);
    const selectedVisibleCount = selectedCandidates.filter(id => allVisibleIds.includes(id)).length;
    const isAllSelected = allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length;

    if (isAllSelected) {
        setSelectedCandidates([]);
    } else {
        setSelectedCandidates(allVisibleIds);
        if (filteredCandidates.length > 20) {
            toast({
                title: "Selection Limit",
                description: "Selected the first 20 candidates. A maximum of 20 can be selected at once.",
            });
        }
    }
  };

  useEffect(() => {
    setFilteredCandidates(initialCandidates);
    handleClearFilters();
  }, [initialCandidates]);

  const availableCompanies = useMemo(() => {
    const companies = new Set(initialCandidates.flatMap(c => c.targetCompanies));
    return Array.from(companies).sort();
  }, [initialCandidates]);

  const isFiltered = useMemo(() => {
    return company !== "" || experience !== "all" || role !== "" || status !== "all";
  }, [company, experience, role, status]);

  const handleApplyFilters = () => {
    let candidates = [...initialCandidates];

    if (company) {
      candidates = candidates.filter(c => c.targetCompanies.some(tc => tc.toLowerCase() === company.toLowerCase()));
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

    if (role) {
      const lowercasedRole = role.toLowerCase();
      candidates = candidates.filter(c =>
        c.currentRole?.toLowerCase().includes(lowercasedRole) || 
        (c.targetRole && c.targetRole.toLowerCase().includes(lowercasedRole))
      );
    }

    if (status !== "all") {
      candidates = candidates.filter(c => c.status === status);
    }
    
    setFilteredCandidates(candidates);
    setSelectedCandidates([]); // Clear selection on new filter
  };

  const handleClearFilters = () => {
    setCompany("");
    setExperience("all");
    setRole("");
    setStatus("all");
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
  
  const getResumeLinksForSelected = async (): Promise<{name: string, url: string, fileName: string}[]> => {
    if (!firebaseReady || !db) {
        toast({ title: "Firebase not ready", description: "The database connection is not available.", variant: "destructive" });
        return [];
    }
    const links = [];
    for (const candidateId of selectedCandidates) {
      try {
        const resumeDocRef = doc(db, "resumes", candidateId);
        const resumeDoc = await getDoc(resumeDocRef);
        const resumeData = resumeDoc.data();
        if (resumeDoc.exists() && resumeData?.fileUrl) {
            const candidate = initialCandidates.find(c => c.id === candidateId);
            links.push({ 
                name: candidate?.name || 'Unknown Candidate',
                url: resumeData.fileUrl,
                fileName: resumeData.fileName || 'resume.pdf'
            });
        }
      } catch (error) {
          console.error(`Error fetching resume for ${candidateId}:`, error);
      }
    }
    return links;
  };


  const handleBulkDownload = async () => {
    if (selectedCandidates.length === 0) return;
    setIsActionLoading(true);

    const resumeLinks = await getResumeLinksForSelected();
    
    if (resumeLinks.length === 0) {
      toast({ title: "No Resumes Found", description: "None of the selected candidates have an uploaded resume.", variant: "destructive" });
    } else if (resumeLinks.length === 1) {
        window.open(resumeLinks[0].url, '_blank');
        toast({
          title: "Download Started",
          description: `Opening ${resumeLinks[0].name}'s resume.`
        });
    } else {
        toast({
            title: "Preparing Download",
            description: `Zipping ${resumeLinks.length} resumes. This may take a moment...`
        });
        try {
            const zip = new JSZip();
            const filePromises = resumeLinks.map(async (link) => {
                try {
                    const response = await fetch(link.url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${link.url}: ${response.statusText}`);
                    }
                    const blob = await response.blob();
                    const sanitizedCandidateName = link.name.replace(/[^a-z0-9]/gi, '_');
                    zip.file(`${sanitizedCandidateName}_${link.fileName}`, blob);
                } catch (error) {
                    console.error(`Could not add resume for ${link.name} to zip:`, error);
                    toast({
                        title: "Download Skipped",
                        description: `Could not fetch resume for ${link.name}.`,
                        variant: "destructive"
                    });
                }
            });

            await Promise.all(filePromises);
            
            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "ReferBridge_Resumes.zip");
             toast({
                title: "Download Ready",
                description: `Your zip file is downloading.`
            });

        } catch (error) {
            console.error("Error creating zip file:", error);
            toast({
                title: "Zip Creation Failed",
                description: "An error occurred while creating the zip file.",
                variant: "destructive"
            });
        }
    }

    setIsActionLoading(false);
    setIsActionDialogOpen(false);
    setSelectedCandidates([]);
  };

  const handleBulkEmail = async () => {
    if (selectedCandidates.length === 0) return;
    setIsActionLoading(true);

    if (!auth.currentUser?.email) {
      toast({
        title: "Error",
        description: "Could not find your email address. Please log in again.",
        variant: "destructive",
      });
      setIsActionLoading(false);
      return;
    }

    const resumeLinks = await getResumeLinksForSelected();

    if (resumeLinks.length === 0) {
        toast({ title: "No Resumes Found", description: "None of the selected candidates have an uploaded resume.", variant: "destructive"});
    } else {
        const subject = `Resumes for ${resumeLinks.length} selected candidate(s)`;
        const body = `Hi,\n\nHere are the resume links for the candidates you selected:\n\n${resumeLinks.map(link => `${link.name}: ${link.url}`).join('\n')}\n\nSent from ReferBridge`;
        window.location.href = `mailto:${auth.currentUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        toast({
            title: "Opening Email Client",
            description: `Preparing an email with ${resumeLinks.length} resume link(s).`
        });
    }

    setIsActionLoading(false);
    setIsActionDialogOpen(false);
    setSelectedCandidates([]);
  };


  const handleCancelRequest = async () => {
    if (selectedCandidates.length === 0 || !db) {
      toast({ title: "Something went wrong", description: "Database not available.", variant: "destructive" });
      return;
    }

    const finalReason = selectedReason === 'other' ? otherReasonText.trim() : selectedReason;

    if (!finalReason) {
      toast({
        title: "Reason Required",
        description: "Please select or provide a reason for cancelling the request(s).",
        variant: "destructive",
      });
      return;
    }

    setIsActionLoading(true);

    try {
      const batch = writeBatch(db);
      const requestsToUpdate = filteredCandidates.filter(c => selectedCandidates.includes(c.id) && c.requestId);

      if (requestsToUpdate.length === 0) {
        toast({ title: "No valid requests found", variant: "destructive" });
        setIsActionLoading(false);
        return;
      }

      requestsToUpdate.forEach(candidate => {
        const requestRef = doc(db, "referral_requests", candidate.requestId!);
        batch.update(requestRef, {
          status: 'Cancelled',
          cancellationReason: finalReason
        });
      });

      await batch.commit();

      setFilteredCandidates(currentCandidates =>
        currentCandidates.filter(c => !selectedCandidates.includes(c.id))
      );


      toast({
        title: "Request(s) Cancelled",
        description: `${requestsToUpdate.length} candidate request(s) have been cancelled.`
      });

      setSelectedCandidates([]);
      resetCancelDialog();

    } catch (error) {
      console.error("Error cancelling requests:", error);
      toast({
        title: "Update Failed",
        description: "Could not cancel the request(s).",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const resetCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setSelectedReason("");
    setOtherReasonText("");
  };

  const handleCandidateUpdate = (candidateId: string) => {
    setFilteredCandidates(prev => prev.filter(c => c.id !== candidateId));
  };

  const allVisibleCandidates = filteredCandidates.slice(0, 20);
  const allVisibleIds = allVisibleCandidates.map(c => c.id);
  const selectedVisibleCount = selectedCandidates.filter(id => allVisibleIds.includes(id)).length;

  const selectAllCheckedState =
    allVisibleIds.length > 0 && selectedVisibleCount === allVisibleIds.length
        ? true
        : selectedVisibleCount > 0
        ? 'indeterminate'
        : false;

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
        status={status}
        setStatus={setStatus}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      
      <div className="flex items-center justify-between min-h-[40px] -mb-2">
        <div className="flex items-center gap-2">
           {filteredCandidates.length > 0 && (
            <>
                <Checkbox
                    id="select-all"
                    onCheckedChange={handleSelectAllToggle}
                    checked={selectAllCheckedState}
                    aria-label="Select all candidates"
                />
                <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All (Max 20)
                </Label>
            </>
           )}
        </div>
        
        {selectedCandidates.length > 0 && (
          <div className="flex items-center gap-4">
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsActionDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download/Share Resume
                  </DropdownMenuItem>
                  {showCancelAction && (
                    <DropdownMenuItem onSelect={() => setIsCancelDialogOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Request
                    </DropdownMenuItem>
                  )}
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
                <Button variant="outline" onClick={handleBulkDownload} className="flex-1" disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download to Device
                </Button>
                <Button onClick={handleBulkEmail} className="flex-1" disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Email Links to Myself
                </Button>
            </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCancelDialogOpen} onOpenChange={(open) => { if (!open) resetCancelDialog(); else setIsCancelDialogOpen(open);}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Cancel Referral Request</DialogTitle>
                <DialogDescription>
                    You are about to cancel the request for {selectedCandidates.length} candidate(s). Please provide a reason below. This will be shared with the candidate.
                </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-4">
                <Label>Reason for Cancellation</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-2">
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Not a good fit for current openings" id="r1" />
                      <Label htmlFor="r1" className="font-normal cursor-pointer">Not a good fit for current openings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Experience level does not match" id="r2" />
                      <Label htmlFor="r2" className="font-normal cursor-pointer">Experience level does not match</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Position has been filled" id="r3" />
                      <Label htmlFor="r3" className="font-normal cursor-pointer">Position has been filled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="r4" />
                      <Label htmlFor="r4" className="font-normal cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
                {selectedReason === 'other' && (
                  <Textarea
                      id="cancel-reason-other"
                      placeholder="Please specify the reason..."
                      className="mt-2 min-h-[100px]"
                      value={otherReasonText}
                      onChange={(e) => setOtherReasonText(e.target.value)}
                  />
                )}
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={resetCancelDialog} disabled={isActionLoading}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelRequest}
                  disabled={isActionLoading || !selectedReason || (selectedReason === 'other' && !otherReasonText.trim())}
                >
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isActionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
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
                onUpdateRequest={handleCandidateUpdate}
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
