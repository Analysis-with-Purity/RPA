import Link from "next/link";
import Image from "next/image";
import { Container, SectionHeading } from "@/components/ui/container";
import { getBrands } from "@/lib/data/products";

const COLLECTIONS = [
  {
    title: "Best Sellers",
    subtitle: "The fragrances everyone keeps coming back to.",
    href: "/shop?collection=best-sellers",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=900&q=80",
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh additions to the Purity house.",
    href: "/shop?collection=new-arrivals",
    image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=900&q=80",
  },
  {
    title: "Signature Collection",
    subtitle: "Defining scents of the Purity identity.",
    href: "/shop?collection=signature",
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=900&q=80",
  },
  {
    title: "Luxury Gift Sets",
    subtitle: "Beautifully curated sets, ready to gift.",
    href: "/shop?collection=gift-sets",
    image: "https://images.unsplash.com/photo-1610461888750-14bb31ee7e1d?w=900&q=80",
  },
  {
    title: "Limited Edition",
    subtitle: "Rare releases, available while they last.",
    href: "/shop?collection=limited-edition",
    image: "https://images.unsplash.com/photo-1595425964272-4b3a3aad9f97?w=900&q=80",
  },
];

export default async function CollectionsPage() {
  const brands = await getBrands();

  return (
    <div className="bg-white">
      <div className="bg-ivory border-b border-line py-16">
        <Container>
          <SectionHeading
            eyebrow="Explore"
            title="Collections"
            subtitle="Browse the Purity catalog the way that suits you — by category or by house."
            align="left"
          />
        </Container>
      </div>

      <Container className="py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COLLECTIONS.map((c) => (
            <Link key={c.title} href={c.href} className="group relative overflow-hidden aspect-[4/3]">
              <Image
                src={c.image}
                alt={c.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <h3 className="font-serif text-white text-xl">{c.title}</h3>
                <p className="text-white/70 text-sm mt-1">{c.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <div className="border-t border-line bg-porcelain py-16">
        <Container>
          <SectionHeading eyebrow="Our Houses" title="Shop by Brand" align="left" />
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/shop?brand=${brand.slug}`}
                className="bg-white border border-line hover:border-gold p-6 text-center font-serif text-lg transition-colors"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </div>
  );
}
