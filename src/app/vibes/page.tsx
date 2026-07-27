import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui/container";
import { getVibes } from "@/lib/data/products";

export default async function VibesPage() {
  const vibes = await getVibes();

  return (
    <div className="bg-white">
      <div className="bg-ivory border-b border-line py-16">
        <Container>
          <SectionHeading
            eyebrow="A Purity Original"
            title="Shop by Vibe"
            subtitle="Fragrance is emotion. Pick the mood you want to wear, and we'll guide you to the scents that match it."
            align="left"
          />
        </Container>
      </div>

      <Container className="py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {vibes.map((vibe) => (
            <Link
              key={vibe.id}
              href={`/vibes/${vibe.slug}`}
              className="group bg-white border border-line hover:border-gold p-8 flex flex-col items-center text-center gap-3 transition-colors duration-300"
            >
              <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                {vibe.emoji}
              </span>
              <h3 className="font-serif text-lg">{vibe.name}</h3>
              <p className="text-xs text-ink/50 leading-relaxed">{vibe.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
