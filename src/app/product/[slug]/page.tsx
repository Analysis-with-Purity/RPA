import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge, GoldBadge } from "@/components/ui/badge";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ReviewSection } from "@/components/product/review-section";
import { StarRating } from "@/components/product/star-rating";
import { ProductCard } from "@/components/product/product-card";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { parseImages } from "@/lib/data/product-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} by ${product.brand.name} — Purity`,
    description: product.shortDescription,
  };
}

function NoteRow({ label, notes }: { label: string; notes: string }) {
  return (
    <div className="flex gap-4 py-3 border-b border-line">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-[0.12em] text-ink/40">{label}</span>
      <span className="text-sm">{notes.split(",").map((n) => n.trim()).join(" · ")}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-line text-sm">
      <span className="text-ink/50">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const images = parseImages(product.images);
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="bg-white">
      <Container className="py-10 md:py-14">
        <div className="grid lg:grid-cols-2 gap-14">
          <Gallery images={images} name={product.name} />

          <div>
            <div className="flex items-center gap-2 mb-3">
              {product.isBestSeller && <GoldBadge>Bestseller</GoldBadge>}
              {product.isNewArrival && <Badge>New Arrival</Badge>}
              {product.isLimitedEdition && <Badge className="border-royal text-royal">Limited Edition</Badge>}
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-ink/40">{product.brand.name}</p>
            <h1 className="font-serif text-3xl md:text-4xl mt-1">{product.name}</h1>
            <div className="mt-3">
              <StarRating rating={avgRating} count={product.reviews.length} />
            </div>
            <p className="mt-5 text-ink/70 leading-relaxed italic">{product.shortDescription}</p>

            <div className="mt-8">
              <PurchasePanel
                productId={product.id}
                slug={product.slug}
                name={product.name}
                brand={product.brand.name}
                image={images[0]}
                sizes={product.sizes}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-14 mt-20">
          <div>
            <h2 className="font-serif text-2xl mb-4">The Fragrance</h2>
            <p className="text-ink/70 leading-relaxed">{product.description}</p>

            <div className="mt-8">
              <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink/50 mb-2">Fragrance Notes</h3>
              <NoteRow label="Top Notes" notes={product.topNotes} />
              <NoteRow label="Heart Notes" notes={product.middleNotes} />
              <NoteRow label="Base Notes" notes={product.baseNotes} />
            </div>

            <p className="mt-6 text-sm text-ink/60 leading-relaxed">
              <span className="text-ink font-medium">Perfect for: </span>
              {product.perfectFor}
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl mb-4">Details</h2>
            <DetailRow label="Fragrance Family" value={product.fragranceFamily} />
            <DetailRow label="Gender" value={product.gender.charAt(0) + product.gender.slice(1).toLowerCase()} />
            <DetailRow label="Longevity" value={product.longevity} />
            <DetailRow label="Projection" value={product.projection} />
            <DetailRow label="Best Season" value={product.bestSeason} />
            <DetailRow label="Best Occasion" value={product.bestOccasion} />
            <DetailRow label="Available Sizes" value={product.sizes.map((s) => `${s.size}ml`).join(", ")} />

            {product.vibes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink/50 mb-3">Shop by Vibe</h3>
                <div className="flex flex-wrap gap-2">
                  {product.vibes.map(({ vibe }) => (
                    <Badge key={vibe.id}>
                      {vibe.emoji} {vibe.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-24 pt-16 border-t border-line">
          <ReviewSection
            productId={product.id}
            reviews={product.reviews}
            avgRating={avgRating}
          />
        </div>

        {related.length > 0 && (
          <div className="mt-24 pt-16 border-t border-line">
            <h2 className="font-serif text-2xl mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
