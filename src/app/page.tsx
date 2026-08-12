import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/hero/HeroSection';
import { ExploreCards } from '@/components/sections/ExploreCards';

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ExploreCards />
      <Footer />
    </main>
  );
}
