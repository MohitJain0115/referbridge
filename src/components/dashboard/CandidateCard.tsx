
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import type { Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { DollarSign, Eye, CheckCircle, XCircle, MoreVertical, Briefcase, Download, Circle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase";

type CandidateCardProps = {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
};

export function CandidateCard({ candidate, isSelected, onSelect }: CandidateCardProps) {
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<Candidate['status']>(candidate.status);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent click event from firing on interactive elements inside the card
    if (e.target instanceof HTMLElement && e.target.closest('button, a, [role="menuitem"]')) {
      return;
    }
    onSelect(candidate.id);
  };

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card from being selected
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

  const handleSetStatus = async (newStatus: Candidate['status']) => {
    if (!firebaseReady || !db) {
      toast({ title: "Database not available", variant: "destructive" });
      return;
    }
    try {
      // If a requestId is present, update the request document.
      // Otherwise, update the general profile document.
      const docRef = candidate.requestId
        ? doc(db, "referral_requests", candidate.requestId)
        : doc(db, "profiles", candidate.id);
        
      await updateDoc(docRef, { status: newStatus });
      setCurrentStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `${candidate.name}'s status set to ${newStatus}.`,
      });
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
    'Not a Fit': XCircle
  };

  return (
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
          <div className="flex items-start justify-between">
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
              {currentStatus}
            </Badge>
          </div>
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
            <Link href={`/profile/${candidate.id}`} onClick={e => e.stopPropagation()}>
              <Eye className="mr-2 h-4 w-4" /> View Profile
            </Link>
          </Button>
        </CardFooter>
      </Card>
  );
}
