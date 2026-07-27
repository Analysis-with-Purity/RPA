import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { SortDropdown } from "@/components/shop/sort-dropdown";
import { searchProducts, getFilterOptions, type ProductFilters } from "@/lib/data/products";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const filters: ProductFilters = {
    q: params.q,
    gender: params.gender,
    brandSlug: params.brand,
    fragranceFamily: params.family,
    season: params.season,
    occasion: params.occasion,
    vibeSlug: params.vibe,
    collection: params.collection as ProductFilters["collection"],
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    size: params.size ? Number(params.size) : undefined,
    longevity: params.longevity,
    projection: params.projection,
    minRating: params.minRating ? Number(params.minRating) : undefined,
    inStockOnly: params.inStock === "1",
    sort: (params.sort as ProductFilters["sort"]) ?? "newest",
  };

  const [products, options] = await Promise.all([searchProducts(filters), getFilterOptions()]);

  return (
    <div className="bg-white">
      <div className="bg-ivory border-b border-line py-10">
        <Container>
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-2">The Collection</p>
          <h1 className="font-serif text-3xl md:text-4xl">
            {params.q ? `Results for "${params.q}"` : "Shop All Fragrances"}
          </h1>
        </Container>
      </div>

      <Container className="py-12">
        <div className="grid md:grid-cols-[240px_1fr] gap-10">
          <ShopFilters options={options} />

          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-ink/50">{products.length} fragrance{products.length !== 1 ? "s" : ""}</p>
              <SortDropdown />
            </div>

            {products.length === 0 ? (
              <div className="border border-line p-16 text-center text-sm text-ink/50">
                No fragrances match your filters. Try adjusting your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
