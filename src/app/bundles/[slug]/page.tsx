import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { formatNaira } from "@/lib/utils";
import { getBundleBySlug } from "@/lib/data/products";
import { bundlePricing, bundleItemPrice, type BundleDetailData } from "@/lib/data/bundle-helpers";
import { AddBundleButton } from "@/components/shop/add-bundle-button";
import { parseImages } from "@/lib/data/product-helpers";

export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = (await getBundleBySlug(slug)) as unknown as BundleDetailData | null;
  if (!bundle) notFound();

  const { originalTotal, bundlePrice, discountAmount } = bundlePricing(bundle);

  return (
    <div className="bg-white">
      <Container className="py-14">
        <div className="grid lg:grid-cols-2 gap-14">
          <div className="relative aspect-[4/5] bg-porcelain">
            <Image src={bundle.image} alt={bundle.name} fill sizes="50vw" className="object-cover" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-gold">
              Save {formatNaira(discountAmount)} ({bundle.discountValue}%)
            </span>
            <h1 className="font-serif text-3xl md:text-4xl mt-2">{bundle.name}</h1>
            <p className="text-ink/60 mt-4 leading-relaxed">{bundle.description}</p>

            <div className="flex items-center gap-4 mt-6">
              <span className="font-serif text-2xl text-royal">{formatNaira(bundlePrice)}</span>
              <span className="text-ink/40 line-through">{formatNaira(originalTotal)}</span>
            </div>

            <div className="mt-8">
              <AddBundleButton
                bundleId={bundle.id}
                slug={bundle.slug}
                name={bundle.name}
                image={bundle.image}
                price={bundlePrice}
              />
            </div>

            <div className="mt-12">
              <h2 className="text-[11px] uppercase tracking-[0.16em] text-ink/50 mb-4">
                What&apos;s Included
              </h2>
              <div className="space-y-4">
                {bundle.items.map((item) => {
                  const images = parseImages(item.product.images);
                  return (
                    <Link
                      key={item.id}
                      href={`/product/${item.product.slug}`}
                      className="flex items-center gap-4 border border-line p-4 hover:border-gold transition-colors"
                    >
                      <div className="relative w-16 h-20 shrink-0 bg-porcelain">
                        <Image src={images[0]} alt={item.product.name} fill sizes="80px" className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-wide text-ink/40">{item.product.brand.name}</p>
                        <p className="font-serif text-base">{item.product.name}</p>
                        <p className="text-xs text-ink/40 mt-1">
                          {item.size ? `${item.size.size}ml` : "Standard size"} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm">{formatNaira(bundleItemPrice(item) * item.quantity)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
