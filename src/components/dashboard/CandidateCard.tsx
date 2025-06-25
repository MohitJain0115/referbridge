"use client";

import Image from "next/image";
import type { Candidate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DollarSign, Download, Eye, CheckCircle, XCircle, MoreVertical } from "lucide-react";

type CandidateCardProps = {
  candidate: Candidate;
};

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Card className="flex flex-col">
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
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Resume
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
        <Button className="w-full">
            <Eye className="mr-2 h-4 w-4" /> View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
