import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="w-full py-20 md:py-32">
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-6 text-center md:text-left items-center md:items-start">
          <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold">
            Unlock Your Career Potential with a Referral
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
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
        <div className="flex items-center justify-center">
            <Image 
                src="https://storage.googleapis.com/idx-dev-01-public-images/5948332c-7b2a-4467-b52b-7f15e855734e.png"
                width={600}
                height={400}
                alt="A person handing over a resume during a job interview."
                className="rounded-lg shadow-2xl object-cover"
                data-ai-hint="resume interview"
            />
        </div>
      </div>
    </section>
  );
}
