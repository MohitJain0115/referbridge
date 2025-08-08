import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="w-full py-20 md:py-32">
      <div className="container flex flex-col items-center gap-6 text-center">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold max-w-3xl">
          Unlock Your Career Potential with a Referral
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          ReferBridge connects ambitious job seekers with company insiders willing to give them a boost. Stop cold application and start getting referred.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Find a Referrer</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">I Want to Refer</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
