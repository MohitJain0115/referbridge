import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ValueProps } from '@/components/home/ValueProps';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="px-6">
          <HeroSection />
        </div>
        <HowItWorks />
        <ValueProps />
      </main>
      <Footer />
    </div>
  );
}
