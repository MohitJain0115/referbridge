import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="container grid lg:grid-cols-2 gap-12 items-center py-20 md:py-32">
      <div className="flex flex-col gap-6">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold">
          Unlock Your Career Potential with a Referral
        </h1>
        <p className="text-lg text-muted-foreground">
          ReferBridge connects ambitious job seekers with company insiders willing to give them a boost. Stop cold applying and start getting referred.
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
      <div className="hidden lg:block">
         <Image 
          src="/hero-image.png"
          alt="A person in a suit handing a resume across a wooden table to another person."
          width={600}
          height={400}
          className="rounded-lg shadow-2xl"
        />
      </div>
    </section>
  );
}
