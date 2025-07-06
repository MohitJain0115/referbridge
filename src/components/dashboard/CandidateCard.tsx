"use client";

import { useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import type { Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DollarSign, Download, Eye, CheckCircle, XCircle, MoreVertical, Briefcase, Mail, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db, firebaseReady, auth } from "@/lib/firebase";

type CandidateCardProps = {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
};

export function CandidateCard({ candidate, isSelected, onSelect }: CandidateCardProps) {
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { toast } = useToast();

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent click event from firing on interactive elements inside the card
    if (e.target instanceof HTMLElement && e.target.closest('button, a, [role="menuitem"]')) {
      return;
    }
    onSelect(candidate.id);
  };

  const getResumeUrl = async (): Promise<string | null> => {
    if (!firebaseReady || !db) {
        toast({ title: "Firebase not ready", description: "The database connection is not available.", variant: "destructive" });
        return null;
    }
    try {
        const resumeDocRef = doc(db, "resumes", candidate.id);
        const resumeDoc = await getDoc(resumeDocRef);
        if (resumeDoc.exists()) {
            return resumeDoc.data().fileUrl || null;
        }
        return null;
    } catch (error) {
        console.error("Error fetching resume:", error);
        toast({ title: "Error", description: "Could not fetch resume. Check Firestore security rules.", variant: "destructive" });
        return null;
    }
  };


  const handleDownload = async () => {
    setIsActionLoading(true);
    const resumeUrl = await getResumeUrl();
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
      toast({
        title: "Resume Downloading",
        description: "Your download should begin shortly.",
      });
    } else {
      toast({
        title: "No Resume Found",
        description: `${candidate.name} has not uploaded a resume.`,
        variant: "destructive",
      });
    }
    setIsActionLoading(false);
    setIsActionDialogOpen(false);
  };

  const handleEmail = async () => {
    setIsActionLoading(true);
    if (!auth.currentUser?.email) {
      toast({
        title: "Error",
        description: "Could not find your email address. Please log in again.",
        variant: "destructive",
      });
      setIsActionLoading(false);
      setIsActionDialogOpen(false);
      return;
    }

    const resumeUrl = await getResumeUrl();
    if (resumeUrl) {
      const subject = `Referral Resume: ${candidate.name}`;
      const body = `Hi,\n\nHere is the resume link for ${candidate.name} for your referral consideration:\n\n${resumeUrl}\n\nSent from ReferBridge`;
      window.location.href = `mailto:${auth.currentUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
       toast({
        title: "Opening Email Client",
        description: `Preparing an email to be sent from your account to ${auth.currentUser.email}.`,
      });
    } else {
      toast({
        title: "No Resume Found",
        description: `${candidate.name} has not uploaded a resume.`,
        variant: "destructive",
      });
    }
    setIsActionLoading(false);
    setIsActionDialogOpen(false);
  };

  return (
    <>
      <Card 
        className={cn(
          "flex flex-col transition-all relative cursor-pointer", 
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
          <div className="flex items-center justify-between">
            <Image
              src={candidate.avatar}
              alt={candidate.name}
              width={64}
              height={64}
              className="rounded-full border-2 border-primary/50"
              data-ai-hint="person avatar"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setIsActionDialogOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download/Share Resume
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  Mark as Viewed
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Referred
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <XCircle className="mr-2 h-4 w-4" />
                  Not a Fit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="font-headline pt-4">{candidate.name}</CardTitle>
          <CardDescription>{candidate.role}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{candidate.salary.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })} expected salary</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>{candidate.experience} {candidate.experience === 1 ? 'year' : 'years'} of experience</span>
          </div>
           <div className="space-y-2">
              <h4 className="text-sm font-medium">Top Skills</h4>
              <div className="flex flex-wrap gap-2">
                  {candidate.skills.slice(0,3).map(skill => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
              </div>
           </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" asChild>
            <Link href={`/profile/${candidate.id}`}>
              <Eye className="mr-2 h-4 w-4" /> View Profile
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume for {candidate.name}</DialogTitle>
            <DialogDescription>
              Choose how you would like to handle the resume for {candidate.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button variant="outline" onClick={handleDownload} className="flex-1" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download to Device
            </Button>
            <Button onClick={handleEmail} className="flex-1" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Email Link to Myself
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
