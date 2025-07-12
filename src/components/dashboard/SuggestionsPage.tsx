
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { auth, db, firebaseReady } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function SuggestionsPage() {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseReady || !auth.currentUser) {
      toast({ title: "Please log in to submit a suggestion.", variant: "destructive" });
      return;
    }
    if (!suggestion.trim()) {
      toast({ title: "Suggestion cannot be empty.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        userId: auth.currentUser.uid,
        suggestion: suggestion.trim(),
        createdAt: serverTimestamp(),
      });
      toast({
        title: "Suggestion Sent!",
        description: "Thank you for your feedback. We appreciate you helping us improve.",
      });
      setSuggestion('');
    } catch (error: any) {
      console.error("Error submitting suggestion:", error);
      let description = "Could not send your suggestion. Please try again.";
      if (error.code === 'permission-denied') {
        description = "Permission denied. Please check your Firestore security rules for the 'suggestions' collection.";
      }
      toast({ title: "Submission Failed", description, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Suggestions
        </h1>
        <p className="text-muted-foreground">
          Have an idea to make ReferBridge better? We'd love to hear it!
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Share Your Feedback</CardTitle>
            <CardDescription>
              Let us know what features you'd like to see, or how we can improve your experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your suggestion here..."
              className="min-h-[150px]"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              disabled={isSubmitting}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !suggestion.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
