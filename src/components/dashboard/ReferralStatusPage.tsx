
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { generateTrackedRequests } from "@/ai/flows/tracked-requests-flow";
import type { TrackedRequest, ReferralRequestStatus } from "@/ai/flows/tracked-requests-flow";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { Info, Inbox, Download, Clock, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function ReferralStatusPage() {
  const [requests, setRequests] = useState<TrackedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReferralRequestStatus | 'all'>('all');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const generatedRequests = await generateTrackedRequests(4);
        setRequests(generatedRequests);
      } catch (error) {
        console.error("Failed to generate tracked requests:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);
  
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

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') {
        return requests;
    }
    return requests.filter((r) => r.status === filterStatus);
  }, [filterStatus, requests]);

  const totalRequests = requests.length;
  const downloadedRequests = requests.filter(
    (r) => r.status === "Resume Downloaded"
  ).length;
  const pendingRequests = requests.filter(
    (r) => r.status === "Pending"
  ).length;
  const cancelledRequests = requests.filter(
    (r) => r.status === "Cancelled"
  ).length;

  const toggleSelection = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((reqId) => reqId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map((r) => r.id));
    }
  };

  const handleDelete = () => {
    setRequests(requests.filter((r) => !selectedRequests.includes(r.id)));
    setSelectedRequests([]);
    toast({
      title: "Requests Deleted",
      description: "The selected referral requests have been removed.",
    });
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold md:text-2xl font-headline">My Referral Requests</h1>
                <p className="text-muted-foreground">Track the status of the referrals you've requested. Click a card to filter.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[108px]" />)}
            </div>
            <Skeleton className="h-[300px] w-full" />
        </div>
    )
  }

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
            onClick={() => { setFilterStatus('all'); setSelectedRequests([]); }}
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
            onClick={() => { setFilterStatus('Resume Downloaded'); setSelectedRequests([]); }}
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
             onClick={() => { setFilterStatus('Pending'); setSelectedRequests([]); }}
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
             onClick={() => { setFilterStatus('Cancelled'); setSelectedRequests([]); }}
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
      
      {selectedRequests.length > 0 && (
        <div className="flex items-center gap-4 p-2 rounded-lg bg-muted border">
            <span className="text-sm text-muted-foreground font-medium pl-2">
                {selectedRequests.length} request(s) selected
            </span>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected referral requests.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedRequests([])}
            >
                Clear selection
            </Button>
        </div>
      )}


      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={filteredRequests.length > 0 && selectedRequests.length === filteredRequests.length}
                  onCheckedChange={toggleSelectAll}
                  disabled={filteredRequests.length === 0}
                  aria-label="Select all"
                />
              </TableHead>
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
                  <Checkbox
                    checked={selectedRequests.includes(request.id)}
                    onCheckedChange={() => toggleSelection(request.id)}
                    aria-label={`Select request ${request.id}`}
                  />
                </TableCell>
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
                    <TableCell colSpan={5} className="h-24 text-center">
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
