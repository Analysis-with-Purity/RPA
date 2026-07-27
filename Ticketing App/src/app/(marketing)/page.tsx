import type { Metadata } from "next";

import { HeroSection } from "@/components/marketing/HeroSection";
import { LogoCloud } from "@/components/marketing/LogoCloud";
import { StatsBand } from "@/components/marketing/StatsBand";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { FeatureSpotlight } from "@/components/marketing/FeatureSpotlight";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { CtaSection } from "@/components/marketing/CtaSection";

export const metadata: Metadata = {
  title: "Purity — Customer Support That Customers Actually Love",
  description:
    "Resolve tickets faster, automate support with AI, and delight customers from one powerful platform.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LogoCloud />
      <FeaturesSection />
      <FeatureSpotlight />
      <StatsBand />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
