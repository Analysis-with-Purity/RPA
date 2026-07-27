import Link from "next/link";
import Image from "next/image";
import { Container, SectionHeading } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import type { Bundle } from "@/generated/prisma/client";

export function BundleTeaser({ bundles }: { bundles: Bundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <section className="py-24 bg-ink text-white">
      <Container>
        <SectionHeading
          eyebrow="Buy More, Save More"
          title="Curated Combo Bundles"
          subtitle="Thoughtfully paired fragrances for every mood and moment — at a price built for discovery."
          className="[&_h2]:text-white [&_p]:text-white/60"
        />

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {bundles.slice(0, 3).map((bundle) => (
            <Link
              key={bundle.id}
              href={`/bundles/${bundle.slug}`}
              className="group relative overflow-hidden aspect-[4/5] border border-white/10"
            >
              <Image
                src={bundle.image}
                alt={bundle.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <span className="text-[11px] uppercase tracking-[0.16em] text-gold mb-2">
                  Save {bundle.discountValue}%
                </span>
                <h3 className="font-serif text-xl">{bundle.name}</h3>
                <p className="text-sm text-white/70 mt-2">{bundle.tagline}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button href="/bundles" variant="gold" size="lg" className="border-gold text-gold hover:bg-gold hover:text-ink">
            Shop All Bundles
          </Button>
        </div>
      </Container>
    </section>
  );
}
