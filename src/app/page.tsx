import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { VibeGrid } from "@/components/home/vibe-grid";
import { ProductRail } from "@/components/home/product-rail";
import { TrustStrip } from "@/components/home/trust-strip";
import { BundleTeaser } from "@/components/home/bundle-teaser";
import { getFeaturedProducts, getVibes, getBundles } from "@/lib/data/products";

export default async function HomePage() {
  const [bestSellers, newArrivals, vibes, bundles] = await Promise.all([
    getFeaturedProducts("isBestSeller", 4),
    getFeaturedProducts("isNewArrival", 4),
    getVibes(),
    getBundles(),
  ]);

  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedCollections />
      <ProductRail
        eyebrow="Loved By Many"
        title="Best Sellers"
        subtitle="The fragrances our clients return to again and again."
        products={bestSellers}
        viewAllHref="/shop?collection=best-sellers"
      />
      <VibeGrid vibes={vibes} />
      <ProductRail
        eyebrow="Just Landed"
        title="New Arrivals"
        subtitle="The newest additions to the Purity house."
        products={newArrivals}
        viewAllHref="/shop?collection=new-arrivals"
      />
      <BundleTeaser bundles={bundles} />
    </>
  );
}
