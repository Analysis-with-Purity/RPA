import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";
import { getVibeBySlug, getProductsByVibe } from "@/lib/data/products";

export default async function VibeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vibe = await getVibeBySlug(slug);
  if (!vibe) notFound();

  const products = await getProductsByVibe(slug);

  return (
    <div className="bg-white">
      <div className="bg-ink text-white py-20 text-center">
        <Container>
          <span className="text-5xl block mb-4">{vibe.emoji}</span>
          <h1 className="font-serif text-4xl">{vibe.name}</h1>
          <p className="mt-3 text-white/60 max-w-lg mx-auto">{vibe.description}</p>
        </Container>
      </div>

      <Container className="py-14">
        <p className="text-sm text-ink/50 mb-6">{products.length} fragrances matching this vibe</p>
        {products.length === 0 ? (
          <div className="border border-line p-16 text-center text-sm text-ink/50">
            No fragrances tagged with this vibe yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
