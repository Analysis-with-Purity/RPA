import Link from "next/link";
import Image from "next/image";
import { Container, SectionHeading } from "@/components/ui/container";
import { formatNaira } from "@/lib/utils";
import { getBundles } from "@/lib/data/products";
import { bundlePricing, type BundleDetailData } from "@/lib/data/bundle-helpers";

export default async function BundlesPage() {
  const bundles = (await getBundles()) as unknown as BundleDetailData[];

  return (
    <div className="bg-white">
      <div className="bg-ivory border-b border-line py-16">
        <Container>
          <SectionHeading
            eyebrow="Buy More, Save More"
            title="Combo Bundles"
            subtitle="Curated fragrance pairings, mixed and matched for every mood — priced for discovery."
            align="left"
          />
        </Container>
      </div>

      <Container className="py-14">
        <div className="grid md:grid-cols-2 gap-8">
          {bundles.map((bundle) => {
            const { originalTotal, bundlePrice } = bundlePricing(bundle);
            return (
              <Link
                key={bundle.id}
                href={`/bundles/${bundle.slug}`}
                className="group flex gap-6 border border-line hover:border-gold p-5 transition-colors"
              >
                <div className="relative w-32 h-40 shrink-0 overflow-hidden bg-porcelain">
                  <Image
                    src={bundle.image}
                    alt={bundle.name}
                    fill
                    sizes="150px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-gold">
                    Save {bundle.discountValue}%
                  </span>
                  <h3 className="font-serif text-xl mt-1">{bundle.name}</h3>
                  <p className="text-sm text-ink/60 mt-2 leading-relaxed">{bundle.tagline}</p>
                  <p className="text-xs text-ink/40 mt-2">{bundle.items.length} fragrances included</p>
                  <div className="mt-auto pt-4 flex items-center gap-3">
                    <span className="text-base font-medium">{formatNaira(bundlePrice)}</span>
                    <span className="text-sm text-ink/40 line-through">{formatNaira(originalTotal)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
