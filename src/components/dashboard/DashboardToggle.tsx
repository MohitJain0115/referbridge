import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DashboardToggleProps = {
  currentView: 'seeker' | 'referrer' | string;
};

export function DashboardToggle({ currentView }: DashboardToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
      <Button asChild variant={currentView === 'seeker' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", {'shadow-md': currentView === 'seeker'})}>
        <Link href="/dashboard?view=seeker"><span className="font-bold pr-1">FIND</span> Referrer</Link>
      </Button>
      <Button asChild variant={currentView === 'referrer' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", {'shadow-md': currentView === 'referrer'})}>
        <Link href="/dashboard?view=referrer"><span className="font-bold pr-1">FIND</span> Job Seeker</Link>
      </Button>
    </div>
  );
}
