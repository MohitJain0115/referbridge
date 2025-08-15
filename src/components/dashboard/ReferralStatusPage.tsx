
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import type { TrackedRequest, ReferralRequestStatus, Referrer } from "@/lib/types";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Mail, Eye, Clock, XCircle, Trash2, CheckCircle, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, writeBatch, updateDoc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';
import { awardPointsForReferral } from "@/actions/leaderboard";

const CONFIRMATION_LIMIT = 5;

export function ReferralStatusPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [requests, setRequests] = useState<TrackedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReferralRequestStatus | 'all'>('all');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            setIsLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (user: FirebaseUser) => {
    if (!db) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const requestsQuery = query(collection(db, "referral_requests"), where("seekerId", "==", user.uid));
      const requestSnapshots = await getDocs(requestsQuery);

      const trackedRequestsPromises = requestSnapshots.docs.map(async (requestDoc) => {
        const requestData = requestDoc.data();
        const referrerDocRef = doc(db, "profiles", requestData.referrerId);
        const referrerDoc = await getDoc(referrerDocRef);

        if (!referrerDoc.exists()) {
          console.warn(`Referrer profile not found for ID: ${requestData.referrerId}`);
          return null;
        }

        const referrerData = referrerDoc.data();
        
        return {
          id: requestDoc.id,
          referrer: {
            id: referrerDoc.id,
            name: referrerData.name || "Unknown Referrer",
            avatar: referrerData.profilePic || "https://placehold.co/100x100.png",
            role: referrerData.currentRole || "N/A",
            company: referrerData.referrerCompany || "N/A",
            specialties: referrerData.referrerSpecialties?.split(',').map((s:string) => s.trim()).filter(Boolean) || [],
          },
          status: requestData.status,
          cancellationReason: requestData.cancellationReason,
          requestedAt: requestData.requestedAt?.toDate() || new Date(),
        } as TrackedRequest;
      });

      const results = (await Promise.all(trackedRequestsPromises)).filter(Boolean) as TrackedRequest[];
      // Sort by most recent
      results.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setRequests(results);

    } catch (error) {
      console.error("Failed to fetch tracked requests:", error);
      toast({ title: "Error", description: "Could not fetch your referral requests.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchData(currentUser);
    }
  }, [currentUser, toast]);

  const handleConfirmReferral = async (request: TrackedRequest) => {
    if (!db || !currentUser) return;
    setIsConfirming(request.id);
    try {
        const result = await awardPointsForReferral({
          requestId: request.id,
          referrerId: request.referrer.id,
        });

        if (result.success) {
            toast({
                title: "Referral Confirmed!",
                description: "Thank you for confirming. This helps us identify top referrers."
            });
            await fetchData(currentUser); // Refresh data
        } else {
            throw new Error(result.message || "Failed to confirm referral via action.");
        }
    } catch (error: any) {
        console.error("Error confirming referral:", error);
        toast({ title: "Error", description: error.message || "Could not confirm the referral.", variant: "destructive" });
    } finally {
        setIsConfirming(null);
    }
  }
  
  const getStatusBadgeVariant = (status: ReferralRequestStatus) => {
    switch (status) {
      case "Confirmed Referral":
        return "default";
      case "Referred - Awaiting Confirmation":
      case "Viewed":
        return "secondary";
      case "Pending":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const pendingConfirmationsCount = useMemo(() => 
    requests.filter(r => r.status === 'Referred - Awaiting Confirmation').length,
    [requests]
  );

  const isConfirmationBlocked = pendingConfirmationsCount >= CONFIRMATION_LIMIT;


  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') {
        return requests;
    }
    return requests.filter((r) => r.status === filterStatus);
  }, [filterStatus, requests]);

  const totalRequests = requests.length;
  const viewedRequests = requests.filter(
    (r) => r.status === "Viewed" || r.status === "Confirmed Referral" || r.status === "Referred - Awaiting Confirmation"
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

  const handleDelete = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    selectedRequests.forEach(id => {
      batch.delete(doc(db, "referral_requests", id));
    });
    
    try {
      await batch.commit();
      setRequests(requests.filter((r) => !selectedRequests.includes(r.id)));
      setSelectedRequests([]);
      toast({
        title: "Requests Deleted",
        description: "The selected referral requests have been removed.",
      });
    } catch (error) {
       toast({
        title: "Deletion Failed",
        description: "Could not delete the selected requests.",
        variant: "destructive"
      });
    }
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
                  <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{totalRequests}</div>
              </CardContent>
          </Card>
          <Card
            onClick={() => { setFilterStatus('Referred - Awaiting Confirmation'); setSelectedRequests([]); }}
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              filterStatus === 'Referred - Awaiting Confirmation' && "border-primary ring-2 ring-primary"
            )}
          >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Viewed / Referred</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{viewedRequests}</div>
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

      {isConfirmationBlocked && (
         <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
                You have {pendingConfirmationsCount} pending referral confirmations. Please confirm them to see the status of your other applications.
            </AlertDescription>
        </Alert>
      )}
      
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
                      className="rounded-full object-cover aspect-square"
                      data-ai-hint="person avatar"
                    />
                    <div className="font-medium">{request.referrer.name}</div>
                  </div>
                </TableCell>
                <TableCell>{request.referrer.company}</TableCell>
                <TableCell>{formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}</TableCell>
                <TableCell>
                   <div className={cn("flex items-center gap-2", isConfirmationBlocked && request.status !== 'Referred - Awaiting Confirmation' && "blur-sm pointer-events-none")}>
                     {request.status === 'Referred - Awaiting Confirmation' ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleConfirmReferral(request)}
                            disabled={isConfirming === request.id}
                        >
                            {isConfirming === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Confirm Referral
                        </Button>
                     ) : (
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status}
                        </Badge>
                     )}
                     
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
                        No requests found. You can find referrers in the main dashboard.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
