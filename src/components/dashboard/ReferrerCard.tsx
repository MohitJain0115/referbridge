"use client";

import { useState } from "react";
import Image from "next/image";
import type { Referrer } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Sparkles, Users, Send } from "lucide-react";

type ReferrerCardProps = {
  referrer: Referrer;
};

export function ReferrerCard({ referrer }: ReferrerCardProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jobUrl, setJobUrl] = useState("");

  const handleSendRequest = () => {
    // In a real app, this would send the request to a backend.
    console.log(`Sending profile to ${referrer.name} for job: ${jobUrl}`);
    
    toast({
      title: "Profile Sent!",
      description: `Your profile and resume have been shared with ${referrer.name}.`,
    });

    setIsDialogOpen(false);
    setJobUrl("");
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center text-center">
        <Image
          src={referrer.avatar}
          alt={referrer.name}
          width={80}
          height={80}
          className="rounded-full border-2 border-primary/50"
          data-ai-hint="person avatar"
        />
        <div className="pt-4">
            <CardTitle className="font-headline">{referrer.name}</CardTitle>
            <CardDescription>{referrer.role}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <span>Works at <span className="font-semibold text-foreground">{referrer.company}</span></span>
        </div>
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{referrer.connections}+ connections</span>
        </div>
        <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Specializes in</span>
            </h4>
            <div className="flex flex-wrap gap-1">
                {referrer.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary">{specialty}</Badge>
                ))}
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
                Request Referral
            </Button>
          </DialogTrigger>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Share your profile with {referrer.name}</DialogTitle>
                  <DialogDescription>
                      Your full profile and resume will be shared with {referrer.name} for their consideration. You can optionally add a link to a specific job posting to increase your chances.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                  <Label htmlFor="job-url">Job Post URL (Optional)</Label>
                  <Input
                      id="job-url"
                      placeholder="https://www.company.com/careers/..."
                      className="mt-2"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                  />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSendRequest}>
                      <Send className="mr-2 h-4 w-4" />
                      Share Profile
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
