"use client";

import Image from "next/image";
import type { Referrer } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Handshake, Users } from "lucide-react";

type ReferrerCardProps = {
  referrer: Referrer;
};

export function ReferrerCard({ referrer }: ReferrerCardProps) {
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
          <Handshake className="h-4 w-4" />
          <span>{referrer.referrals} successful referrals</span>
        </div>
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{referrer.connections}+ connections</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
            Request Referral
        </Button>
      </CardFooter>
    </Card>
  );
}
