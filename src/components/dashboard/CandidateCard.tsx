
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import type { Candidate, ReferralRequestStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle, Briefcase, Download, Circle, Send, Loader2, Link as LinkIcon, Mail, RotateCcw, MoreVertical, Info, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, firebaseReady, auth } from "@/lib/firebase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveAs } from 'file-saver';
import { downloadResumeWithLimit } from "@/actions/resume";

type CandidateCardProps = {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
  onUpdateRequest?: (candidateId: string) => void;
  isFromRequestPage?: boolean;
};

export function CandidateCard({ candidate, isSelected, onSelect, onUpdateRequest, isFromRequestPage = false }: CandidateCardProps) {
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<Candidate['status']>(candidate.status);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReasonText, setOtherReasonText] = useState("");
  const [isEmailing, setIsEmailing] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('button, a, [role="menuitem"], [role="dialog"], [role="checkbox"]')) {
      return;
    }
    onSelect(candidate.id);
  };

  const handleDownloadResume = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!firebaseReady || !auth.currentUser) {
      toast({ title: "Please log in to download.", variant: "destructive" });
      return;
    }
    
    setIsActionLoading(true);
    try {
      const result = await downloadResumeWithLimit({
        candidateId: candidate.id,
        downloaderId: auth.currentUser.uid,
      });
      
      if (result.success && result.url) {
        toast({
          title: "Download Started",
          description: `Downloading ${candidate.name}'s resume.`
        });
        
        try {
          const response = await fetch(result.url, { mode: 'cors' });
          if (!response.ok) throw new Error(`Fetch failed with status ${response.status}`);
          const blob = await response.blob();
          saveAs(blob, result.fileName);
        } catch (fetchErr) {
          // Fallback: try opening in a new tab/window (may be blocked by popup blocker)
          const win = window.open(result.url, '_blank', 'noopener,noreferrer');
          if (!win) {
            toast({ 
              title: "Popup Blocked",
              description: "Your browser blocked the download. Please allow popups for this site and try again.",
              variant: "destructive" 
            });
          }
        }

      } else {
        toast({ title: "Download Failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error handling resume download:", error);
      toast({ title: "Error", description: "Could not process the resume download.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShareToMail = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!auth.currentUser?.email) {
      toast({ title: "Cannot share", description: "You must be logged in to share.", variant: "destructive" });
      return;
    }

    const mailtoLink = `mailto:${auth.currentUser.email}?subject=${encodeURIComponent(`Resume for ${candidate.name}`)}&body=${encodeURIComponent(`Hi,\n\nPlease find the resume for ${candidate.name} at this link: ${window.location.origin}/profile/${candidate.id}\n\nSent from ReferBridge.`)}`;
    window.location.href = mailtoLink;
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

      if (isFromRequestPage) {
        onUpdateRequest?.(candidate.id);
      }
      resetCancelDialog();

    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({ title: "Update Failed", description: "Could not update the request.", variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetStatus = async (newStatus: ReferralRequestStatus | null) => {
    if (!candidate.requestId || !firebaseReady || !db || !auth.currentUser) {
      toast({
          title: "Action Not Available",
          description: "Status can only be changed on a specific referral request.",
          variant: "destructive"
      });
      return;
    }
    
    if (newStatus === 'Not a Fit') {
        setIsCancelDialogOpen(true);
        return;
    }
    
    const requestRef = doc(db, "referral_requests", candidate.requestId);

    try {
      const statusToSave: ReferralRequestStatus = newStatus === null ? 'Pending' : newStatus;
      await updateDoc(requestRef, { status: statusToSave });
      
      setCurrentStatus(statusToSave);
      
      const toastMessage = newStatus 
        ? `${candidate.name}'s status set to ${newStatus}.`
        : `Status for ${candidate.name} has been reset.`;

      toast({
        title: "Status Updated",
        description: toastMessage,
      });

      // Don't auto-remove on these statuses. The page query will handle visibility.
      if (isFromRequestPage && (statusToSave === 'Cancelled')) {
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
      case 'Confirmed Referral':
        return 'default';
      case 'Referred - Awaiting Confirmation':
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
    'Referred - Awaiting Confirmation': CheckCircle,
    'Confirmed Referral': CheckCircle,
    'Not a Fit': XCircle,
    'Cancelled': XCircle,
    'Resume Downloaded': Download,
  };

  const displayStatus = currentStatus === 'Cancelled' ? 'Not a Fit' : currentStatus;
  const showStatusBadge = currentStatus && currentStatus !== 'Pending';

  return (
    <>
    
      <Card 
        className={cn(
          "flex flex-col transition-all relative cursor-pointer hover:shadow-lg h-full", 
          isSelected && "border-primary ring-2 ring-primary"
        )}
        onClick={handleCardClick}
      >
        <div className="absolute top-2 left-2 z-10">
          <Checkbox 
              id={`select-${candidate.id}`}
              aria-label={`Select ${candidate.name}`}
              checked={isSelected}
              onCheckedChange={(checked) => {
                onSelect(candidate.id);
              }}
              onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        {isFromRequestPage && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => handleSetStatus('Referred - Awaiting Confirmation')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Mark as Referred</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetStatus('Not a Fit')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  <span>Not a Fit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetStatus(null)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Reset Status</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        <CardHeader className="p-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 flex-shrink-0 mr-auto">
              <Image
                src={candidate.avatar}
                alt={candidate.name}
                width={48}
                height={48}
                className="rounded-full border-2 border-primary/50 object-cover aspect-square"
                data-ai-hint="person avatar"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <CardTitle className="font-headline text-base truncate">{candidate.name}</CardTitle>
            {showStatusBadge && displayStatus && (
              <Badge variant={getStatusBadgeVariant(displayStatus)} className="capitalize text-xs flex-shrink-0">
                {React.createElement(statusIcons[displayStatus] ?? Info, { className: "mr-1 h-3 w-3" })}
                {displayStatus}
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs truncate">
            {candidate.currentRole}
            {candidate.targetRole && candidate.targetRole !== candidate.currentRole && (
                <span className="block text-primary/90 font-medium text-xs mt-1 truncate">
                    Seeking: {candidate.targetRole}
                </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-grow space-y-2 p-4 pt-0 text-xs">
          <div className="text-muted-foreground truncate">
            {candidate.salary > 0 && 
              <span>{formatCurrency(candidate.salary, candidate.salaryCurrency || 'INR')} expected salary</span>
            }
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="h-3 w-3" />
              <span>{candidate.experience} {candidate.experience === 1 ? 'year' : 'years'} of experience</span>
          </div>
          {isFromRequestPage && candidate.jobPostUrl && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <LinkIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <a href={candidate.jobPostUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate" onClick={(e) => e.stopPropagation()}>
                {candidate.jobPostUrl}
              </a>
            </div>
          )}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="space-y-1">
                <h4 className="font-medium text-muted-foreground flex items-center gap-2 text-xs">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Top Skills
                </h4>
                <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 3).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                    {candidate.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                            +{candidate.skills.length - 3} more
                        </Badge>
                    )}
                </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 flex-shrink-0">
            <div className="flex gap-2 w-full">
                <Button className="flex-1" size="sm" asChild>
                  <Link href={`/profile/${candidate.id}`} onClick={e => e.stopPropagation()}>
                    <Eye className="mr-2 h-4 w-4" /> View Profile
                  </Link>
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="flex-1" onClick={e => e.stopPropagation()}>
                           <Download className="mr-2 h-4 w-4" /> Resume
                        </Button>
                    </DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                            <DialogTitle>Resume Actions for {candidate.name}</DialogTitle>
                            <DialogDescription>
                                Choose how you would like to handle the resume.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={handleDownloadResume} className="flex-1" disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Download to Device
                            </Button>
                            <Button onClick={handleShareToMail} className="flex-1" disabled={isEmailing}>
                                {isEmailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Email Link to Myself
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
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
