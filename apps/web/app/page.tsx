import { Box } from '@mantine/core';
import { HomeNavigation } from '@/components/home/HomeNavigation';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { UseCasesSection } from '@/components/home/UseCasesSection';

export default async function HomePage() {
  return (
<Box style={{ minHeight: '100vh' }}>
  <HomeNavigation />
  <HeroSection />
  <FeaturesSection />
  <HowItWorksSection />
  <UseCasesSection />
</Box>
  );
}
