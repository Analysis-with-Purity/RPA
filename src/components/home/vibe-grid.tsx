import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/container";
import type { Vibe } from "@/generated/prisma/client";

export function VibeGrid({ vibes }: { vibes: Vibe[] }) {
  return (
    <section className="py-24 bg-porcelain">
      <Container>
        <SectionHeading
          eyebrow="A Purity Original"
          title="Shop by Vibe"
          subtitle="Fragrance is emotion. Choose the mood you want to wear today, and let us guide you to the scents that match it."
        />

        <div className="mt-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {vibes.map((vibe) => (
            <Link
              key={vibe.id}
              href={`/vibes/${vibe.slug}`}
              className="group bg-white border border-line hover:border-gold p-6 flex flex-col items-center text-center gap-3 transition-colors duration-300"
            >
              <span className="text-3xl transition-transform duration-300 group-hover:scale-110">
                {vibe.emoji}
              </span>
              <h3 className="font-serif text-base">{vibe.name}</h3>
              <p className="text-xs text-ink/50 leading-relaxed">{vibe.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
