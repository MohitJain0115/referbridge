
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DashboardToggleProps = {
  currentView: 'seeker' | 'referrer' | string;
};

export function DashboardToggle({ currentView }: DashboardToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-sm text-muted-foreground hidden md:inline">FIND:</span>
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
        <Button asChild variant={currentView === 'seeker' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", {'shadow-md': currentView === 'seeker'})}>
          <Link href="/dashboard?view=seeker">Referrer</Link>
        </Button>
        <Button asChild variant={currentView === 'referrer' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", {'shadow-md': currentView === 'referrer'})}>
          <Link href="/dashboard?view=referrer">Job Seeker</Link>
        </Button>
      </div>
    </div>
  );
}
