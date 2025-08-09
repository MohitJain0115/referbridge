
"use client";

import { useState } from "react";
import Image from "next/image";
import type { Referrer } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Sparkles, Send, Loader2, Info } from "lucide-react";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

type ReferrerCardProps = {
  referrer: Referrer;
};

export function ReferrerCard({ referrer }: ReferrerCardProps) {
  const { toast } = useToast();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [jobInfo, setJobInfo] = useState("");

  const handleSendRequest = async () => {
    if (!firebaseReady || !auth.currentUser) {
      toast({ title: "Please log in to send a request.", variant: "destructive" });
      return;
    }
    setIsSending(true);
    
    try {
      // Check if a request already exists
      const requestsRef = collection(db, "referral_requests");
      const q = query(
        requestsRef,
        where("seekerId", "==", auth.currentUser.uid),
        where("referrerId", "==", referrer.id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast({
          title: "Request Already Sent",
          description: `You have already sent a referral request to ${referrer.name}.`,
          variant: "destructive",
        });
        setIsSending(false);
        setIsRequestDialogOpen(false);
        return;
      }

      await addDoc(collection(db, "referral_requests"), {
        seekerId: auth.currentUser.uid,
        referrerId: referrer.id,
        jobInfo: jobInfo,
        status: "Pending",
        requestedAt: serverTimestamp(),
        cancellationReason: null,
      });
      
      toast({
        title: "Profile Sent!",
        description: `Your profile and resume have been shared with ${referrer.name}. You can track the status in 'My Requests'.`,
      });

      setIsRequestDialogOpen(false);
      setJobInfo("");
    } catch (error: any) {
      console.error("Error sending referral request:", error);
      let description = "Could not send your request. Please try again.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Please check your Firestore security rules for the 'referral_requests' collection.";
      }
      toast({ title: "Request Failed", description, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg">
      <CardHeader className="p-4 items-center text-center">
        <Image
          src={referrer.avatar}
          alt={referrer.name}
          width={64}
          height={64}
          className="rounded-full border-2 border-primary/50 object-cover aspect-square"
          data-ai-hint="person avatar"
        />
        <div className="pt-2">
            <CardTitle className="font-headline text-lg">{referrer.name}</CardTitle>
            <CardDescription className="text-sm">{referrer.role}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 p-4 pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Briefcase className="h-3 w-3" />
          <span>Works at <span className="font-semibold text-foreground">{referrer.company}</span></span>
        </div>
        {referrer.specialties && referrer.specialties.length > 0 && (
            <div className="space-y-1">
                <h4 className="text-xs font-medium flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Specializes in</span>
                </h4>
                <div className="flex flex-wrap gap-1">
                    {referrer.specialties.map(specialty => (
                        <Badge key={specialty} variant="secondary" className="text-xs">{specialty}</Badge>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
            {referrer.bio && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Info className="mr-2 h-4 w-4" /> View Bio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <div className="flex items-center gap-4">
                      <Image
                        src={referrer.avatar}
                        alt={referrer.name}
                        width={48}
                        height={48}
                        className="rounded-full border object-cover aspect-square"
                      />
                      <div>
                        <DialogTitle>{referrer.name}</DialogTitle>
                        <DialogDescription>{referrer.role} at {referrer.company}</DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <div className="py-4 text-sm text-muted-foreground whitespace-pre-wrap border-t pt-4 mt-4">
                    <h3 className="font-semibold text-foreground mb-2">About</h3>
                    <p>{referrer.bio}</p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                    Request Referral
                </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Share your profile with {referrer.name}</DialogTitle>
                      <DialogDescription>
                          Your full profile and resume will be shared with {referrer.name} for their consideration. You can optionally add a job link or ID to increase your chances.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                      <Label htmlFor="job-info">Job Link or ID (Optional)</Label>
                      <Input
                          id="job-info"
                          placeholder="Paste job link or enter Job ID..."
                          className="mt-2"
                          value={jobInfo}
                          onChange={(e) => setJobInfo(e.target.value)}
                      />
                  </div>
                  <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsRequestDialogOpen(false)} disabled={isSending}>Cancel</Button>
                      <Button onClick={handleSendRequest} disabled={isSending}>
                          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                          {isSending ? 'Sending...' : 'Share Profile'}
                      </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
