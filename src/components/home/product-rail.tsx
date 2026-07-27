import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/container";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/data/products";

export function ProductRail({
  eyebrow,
  title,
  subtitle,
  products,
  viewAllHref,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  viewAllHref?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <Container>
        <div className="flex items-end justify-between flex-wrap gap-6">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align="left" />
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-[11px] uppercase tracking-[0.16em] text-royal border-b border-royal pb-1"
            >
              View All
            </Link>
          )}
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
