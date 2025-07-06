"use client";

import Image from "next/image";
import Link from 'next/link';
import type { Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DollarSign, Eye, CheckCircle, XCircle, MoreVertical, Briefcase } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type CandidateCardProps = {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: (candidateId: string) => void;
};

export function CandidateCard({ candidate, isSelected, onSelect }: CandidateCardProps) {

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent click event from firing on interactive elements inside the card
    if (e.target instanceof HTMLElement && e.target.closest('button, a, [role="menuitem"]')) {
      return;
    }
    onSelect(candidate.id);
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
  );
}
