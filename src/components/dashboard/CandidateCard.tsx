
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import type { Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DollarSign, Eye, CheckCircle, XCircle, MoreVertical, Briefcase, Download, Circle, Send, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CandidateCardProps = {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
  onUpdateRequest?: (candidateId: string) => void;
};

export function CandidateCard({ candidate, isSelected, onSelect, onUpdateRequest }: CandidateCardProps) {
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<Candidate['status']>(candidate.status);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReasonText, setOtherReasonText] = useState("");

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('button, a, [role="menuitem"], [role="dialog"]')) {
      return;
    }
    onSelect(candidate.id);
  };

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firebaseReady || !db) {
      toast({ title: "Firebase not ready", variant: "destructive" });
      return;
    }
    try {
      const resumeDocRef = doc(db, "resumes", candidate.id);
      const resumeDoc = await getDoc(resumeDocRef);
      if (resumeDoc.exists() && resumeDoc.data().fileUrl) {
        window.open(resumeDoc.data().fileUrl, '_blank');
        toast({
          title: "Download Started",
          description: `Opening ${candidate.name}'s resume.`
        });
      } else {
        toast({ title: "No Resume Found", description: `${candidate.name} has not uploaded a resume.`, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching resume:", error);
      toast({ title: "Error", description: "Could not fetch the resume.", variant: "destructive" });
    }
  };

  const resetCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setSelectedReason("");
    setOtherReasonText("");
  };

  const handleConfirmCancellation = async () => {
    if (!firebaseReady || !db || !candidate.requestId) {
      toast({ title: "Something went wrong", description: "Database not available or request ID missing.", variant: "destructive" });
      return;
    }

    const finalReason = selectedReason === 'other' ? otherReasonText.trim() : selectedReason;
    if (!finalReason) {
      toast({ title: "Reason Required", description: "Please select or provide a reason.", variant: "destructive" });
      return;
    }

    setIsActionLoading(true);
    try {
      const requestRef = doc(db, "referral_requests", candidate.requestId);
      await updateDoc(requestRef, {
        status: 'Cancelled',
        cancellationReason: finalReason,
      });

      toast({
        title: "Request Cancelled",
        description: `The request for ${candidate.name} has been marked as not a fit.`,
      });

      onUpdateRequest?.(candidate.id);
      resetCancelDialog();

    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({ title: "Update Failed", description: "Could not update the request.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetStatus = async (newStatus: Candidate['status']) => {
    if (!firebaseReady || !db) {
      toast({ title: "Database not available", variant: "destructive" });
      return;
    }
    
    // For single-card "Not a fit", trigger the dialog instead of direct update
    if (newStatus === 'Not a Fit') {
        setIsCancelDialogOpen(true);
        return;
    }

    try {
      const docRef = candidate.requestId
        ? doc(db, "referral_requests", candidate.requestId)
        : doc(db, "profiles", candidate.id);
        
      await updateDoc(docRef, { status: newStatus });
      setCurrentStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `${candidate.name}'s status set to ${newStatus}.`,
      });

      if (newStatus === 'Referred') {
        onUpdateRequest?.(candidate.id);
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      let description = "Could not update candidate status.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Please check your Firestore security rules.";
      }
      toast({ title: "Update Failed", description, variant: "destructive" });
    }
  };
  
  const getStatusBadgeVariant = (status: Candidate['status']) => {
    switch (status) {
      case 'Referred':
        return 'default';
      case 'Viewed':
        return 'secondary';
      case 'Not a Fit':
      case 'Cancelled':
        return 'destructive';
      case 'Pending':
      default:
        return 'outline';
    }
  };
  
  const statusIcons: Record<Candidate['status'], React.ElementType> = {
    'Pending': Circle,
    'Viewed': Eye,
    'Referred': CheckCircle,
    'Not a Fit': XCircle,
    'Cancelled': XCircle,
    'Resume Downloaded': Download,
  };

  const displayStatus = currentStatus === 'Cancelled' ? 'Not a Fit' : currentStatus;

  return (
    <>
      <Card 
        className={cn(
          "flex flex-col transition-all relative cursor-pointer hover:shadow-lg hover:scale-105", 
          isSelected && "border-primary ring-2 ring-primary"
        )}
        onClick={handleCardClick}
      >
        <div className="absolute top-4 left-4 z-10">
          <Checkbox 
              id={`select-${candidate.id}`}
              aria-label={`Select ${candidate.name}`}
              checked={isSelected}
              onCheckedChange={() => onSelect(candidate.id)} 
          />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between">
            <Image
              src={candidate.avatar}
              alt={candidate.name}
              width={64}
              height={64}
              className="rounded-full border-2 border-primary/50 object-cover aspect-square"
              data-ai-hint="person avatar"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={handleDownloadResume}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => handleSetStatus('Viewed')}>
                  <Eye className="mr-2 h-4 w-4" />
                  Mark as Viewed
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleSetStatus('Referred')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Referred
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleSetStatus('Not a Fit')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Not a Fit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <CardTitle className="font-headline">{candidate.name}</CardTitle>
            <Badge variant={getStatusBadgeVariant(currentStatus)} className="capitalize">
              {React.createElement(statusIcons[currentStatus], { className: "mr-1 h-3 w-3" })}
              {displayStatus}
            </Badge>
          </div>
          <CardDescription>
            {candidate.currentRole}
            {candidate.targetRole && candidate.targetRole !== candidate.currentRole && (
                <span className="block text-primary/90 font-medium mt-1">
                    Seeking: {candidate.targetRole}
                </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          {candidate.isSalaryVisible && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{candidate.salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} expected salary</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{candidate.experience} {candidate.experience === 1 ? 'year' : 'years'} of experience</span>
          </div>
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Top Skills</h4>
                <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0,3).map(skill => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" asChild>
            <Link href={`/profile/${candidate.id}`} onClick={e => e.stopPropagation()}>
              <Eye className="mr-2 h-4 w-4" /> View Profile
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isCancelDialogOpen} onOpenChange={(open) => { if (!open) resetCancelDialog(); else setIsCancelDialogOpen(open);}}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
                <DialogTitle>Mark as "Not a Fit"</DialogTitle>
                <DialogDescription>
                    You are about to mark this request as not a fit. Please provide a reason below. This will be shared with the candidate.
                </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-4">
                <Label>Reason</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-2">
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Not a good fit for current openings" id="r1-card" />
                      <Label htmlFor="r1-card" className="font-normal cursor-pointer">Not a good fit for current openings</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Experience level does not match" id="r2-card" />
                      <Label htmlFor="r2-card" className="font-normal cursor-pointer">Experience level does not match</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Position has been filled" id="r3-card" />
                      <Label htmlFor="r3-card" className="font-normal cursor-pointer">Position has been filled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="r4-card" />
                      <Label htmlFor="r4-card" className="font-normal cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
                {selectedReason === 'other' && (
                  <Textarea
                      id="cancel-reason-other-card"
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
                  onClick={handleConfirmCancellation}
                  disabled={isActionLoading || !selectedReason || (selectedReason === 'other' && !otherReasonText.trim())}
                >
                    {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isActionLoading ? 'Saving...' : 'Confirm'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
