"use client";

import { useState, useMemo } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Inbox, Download, Clock, XCircle } from "lucide-react";
import type { ReferralRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReferralStatusPage() {
  const [filterStatus, setFilterStatus] = useState<ReferralRequestStatus | 'all'>('all');
  
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

  const totalRequests = mockTrackedRequests.length;
  const downloadedRequests = mockTrackedRequests.filter(
    (r) => r.status === "Resume Downloaded"
  ).length;
  const pendingRequests = mockTrackedRequests.filter(
    (r) => r.status === "Pending"
  ).length;
  const cancelledRequests = mockTrackedRequests.filter(
    (r) => r.status === "Cancelled"
  ).length;

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') {
        return mockTrackedRequests;
    }
    return mockTrackedRequests.filter((r) => r.status === filterStatus);
  }, [filterStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          My Referral Requests
        </h1>
        <p className="text-muted-foreground">
          Track the status of the referrals you've requested. Click a card to filter.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            onClick={() => setFilterStatus('all')}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              filterStatus === 'all' && "border-primary ring-2 ring-primary"
            )}
          >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totalRequests}</div>
              </CardContent>
          </Card>
          <Card
            onClick={() => setFilterStatus('Resume Downloaded')}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              filterStatus === 'Resume Downloaded' && "border-primary ring-2 ring-primary"
            )}
          >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Downloaded</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{downloadedRequests}</div>
              </CardContent>
          </Card>
          <Card
             onClick={() => setFilterStatus('Pending')}
             className={cn(
               "cursor-pointer transition-all hover:border-primary",
               filterStatus === 'Pending' && "border-primary ring-2 ring-primary"
             )}
          >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{pendingRequests}</div>
              </CardContent>
          </Card>
          <Card
             onClick={() => setFilterStatus('Cancelled')}
             className={cn(
               "cursor-pointer transition-all hover:border-destructive",
               filterStatus === 'Cancelled' && "border-destructive ring-2 ring-destructive"
             )}
          >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{cancelledRequests}</div>
              </CardContent>
          </Card>
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
            {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
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
                        <Dialog>
                           <DialogTrigger asChild>
                              <button>
                                 <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                              </button>
                           </DialogTrigger>
                           <DialogContent>
                              <DialogHeader>
                                 <DialogTitle>Reason for Cancellation</DialogTitle>
                                 <DialogDescription>
                                    The referrer provided the following reason.
                                 </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 bg-muted rounded-md p-4 text-sm">
                                  <p>{request.cancellationReason}</p>
                              </div>
                           </DialogContent>
                        </Dialog>
                     )}
                   </div>
                </TableCell>
              </TableRow>
            ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No requests found with the selected status.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
