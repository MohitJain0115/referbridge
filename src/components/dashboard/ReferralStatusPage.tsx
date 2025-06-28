"use client";

import Image from "next/image";
import { mockTrackedRequests } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ReferralRequestStatus } from "@/lib/types";

export function ReferralStatusPage() {
  const getStatusBadgeVariant = (status: ReferralRequestStatus) => {
    switch (status) {
      case "Resume Downloaded":
        return "default";
      case "Pending":
        return "secondary";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          My Referral Requests
        </h1>
        <p className="text-muted-foreground">
          Track the status of the referrals you've requested.
        </p>
      </div>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referrer</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTrackedRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Image
                      src={request.referrer.avatar}
                      alt={request.referrer.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                      data-ai-hint="person avatar"
                    />
                    <div className="font-medium">{request.referrer.name}</div>
                  </div>
                </TableCell>
                <TableCell>{request.referrer.company}</TableCell>
                <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                   <div className="flex items-center gap-2">
                     <Badge variant={getStatusBadgeVariant(request.status)}>
                       {request.status}
                     </Badge>
                     {request.status === 'Cancelled' && request.cancellationReason && (
                        <TooltipProvider>
                           <Tooltip>
                               <TooltipTrigger asChild>
                                  <button>
                                     <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                  </button>
                               </TooltipTrigger>
                               <TooltipContent>
                                   <p>Reason: {request.cancellationReason}</p>
                               </TooltipContent>
                           </Tooltip>
                        </TooltipProvider>
                     )}
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
