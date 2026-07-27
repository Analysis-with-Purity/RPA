import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/container";

const COLLECTIONS = [
  {
    title: "Best Sellers",
    href: "/shop?collection=best-sellers",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=900&q=80",
  },
  {
    title: "New Arrivals",
    href: "/shop?collection=new-arrivals",
    image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=900&q=80",
  },
  {
    title: "Signature Collection",
    href: "/shop?collection=signature",
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=900&q=80",
  },
  {
    title: "Luxury Gift Sets",
    href: "/shop?collection=gift-sets",
    image: "https://images.unsplash.com/photo-1610461888750-14bb31ee7e1d?w=900&q=80",
  },
  {
    title: "Limited Edition",
    href: "/shop?collection=limited-edition",
    image: "https://images.unsplash.com/photo-1595425964272-4b3a3aad9f97?w=900&q=80",
  },
];

export function FeaturedCollections() {
  return (
    <section className="py-24 bg-white">
      <Container>
        <SectionHeading
          eyebrow="Curated For You"
          title="Featured Collections"
          subtitle="Explore fragrances organised the way you shop — by moment, by milestone, by mood."
        />

        <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-4">
          {COLLECTIONS.map((c, i) => (
            <Link
              key={c.title}
              href={c.href}
              className={`group relative overflow-hidden aspect-[3/4] ${i === 0 ? "col-span-2 md:col-span-1 md:row-span-1" : ""}`}
            >
              <Image
                src={c.image}
                alt={c.title}
                fill
                sizes="(max-width: 768px) 50vw, 20vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-2 text-center">
                <h3 className="font-serif text-white text-lg md:text-xl">{c.title}</h3>
                <span className="mt-2 h-px w-8 bg-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
