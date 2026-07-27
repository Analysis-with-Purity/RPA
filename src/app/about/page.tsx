import Image from "next/image";
import { Container, SectionHeading } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About Us — Purity",
  description:
    "The story of Purity, a modern Nigerian luxury fragrance house devoted to authenticity, craftsmanship and the art of scent.",
};

const VALUES = [
  {
    title: "Uncompromising Authenticity",
    body: "Every bottle that leaves our atelier is verified, batch-coded and sealed. No dupes, no decants passed off as originals — only genuine imported and house-crafted fragrance.",
  },
  {
    title: "Quiet Craftsmanship",
    body: "We work with master perfumers across Grasse, Dubai and Lagos to build compositions that are layered, long-wearing and unmistakably distinct.",
  },
  {
    title: "Radical Transparency",
    body: "From note breakdowns to sourcing, we tell you exactly what is in the bottle and where it came from — because trust is the true luxury.",
  },
  {
    title: "African Excellence",
    body: "Purity was built to prove that world-class perfumery can be led from Lagos — for the Nigerian woman and man who refuse to compromise on quality.",
  },
];

const WHY_CHOOSE_US = [
  {
    title: "100% Genuine Product",
    body: "Every fragrance is sourced directly from authorised distributors or crafted in-house — never grey market, never diluted.",
  },
  {
    title: "Curated, Not Mass-Produced",
    body: "Our catalogue is small on purpose. We would rather stock 60 exceptional fragrances than 600 mediocre ones.",
  },
  {
    title: "Nationwide Delivery",
    body: "From Victoria Island to Kano, Enugu to Port Harcourt — we deliver discreetly and securely across Nigeria.",
  },
  {
    title: "Concierge-Level Service",
    body: "Our fragrance consultants help you find scents suited to your skin chemistry, climate and occasion — before and after you buy.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-ivory">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=80"
            alt="Purity perfume atelier"
            fill
            priority
            className="object-cover opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        </div>
        <Container className="relative py-28 md:py-36 flex flex-col items-center text-center">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold animate-fade-up">
            Est. in Lagos — Made for the World
          </span>
          <h1 className="mt-5 font-serif text-4xl md:text-6xl max-w-3xl animate-fade-up">
            A House Built on Purity of Craft
          </h1>
          <p className="mt-6 max-w-xl text-white/70 text-sm md:text-base leading-relaxed animate-fade-up">
            We are a modern fragrance house obsessed with one idea — that luxury should never
            require compromise on authenticity, quality, or care.
          </p>
        </Container>
      </section>

      {/* Brand story */}
      <section className="py-24">
        <Container className="grid md:grid-cols-2 gap-14 items-center">
          <div className="animate-fade-up">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Our Story</span>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl text-ink">
              Born from a Simple Frustration
            </h2>
            <div className="mt-6 space-y-4 text-sm md:text-base text-ink/70 leading-relaxed">
              <p>
                Purity began in 2019, not in a boardroom, but in the frustration of one too many
                counterfeit bottles bought in good faith. Our founder — a lifelong fragrance
                collector — grew tired of watching friends and family in Lagos pay premium prices
                for perfumes that were diluted, mislabeled, or simply fake.
              </p>
              <p>
                What started as a small circle sourcing verified, authentic fragrances for
                trusted clients has grown into a full house: importing rare and iconic scents
                from across the world, while also crafting our own signature compositions in
                collaboration with independent perfumers.
              </p>
              <p>
                Today, Purity serves discerning clients across Nigeria and the wider African
                continent, united by one belief — that everyone deserves to experience fragrance
                exactly as its creator intended.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden animate-fade-up">
            <Image
              src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1000&q=80"
              alt="Perfume bottles arranged on a marble surface"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </Container>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-porcelain">
        <Container>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-line p-10 md:p-12 animate-fade-up">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Our Mission</span>
              <h3 className="mt-4 font-serif text-2xl md:text-3xl text-ink">
                Make Genuine Luxury Fragrance Accessible
              </h3>
              <p className="mt-5 text-sm md:text-base text-ink/70 leading-relaxed">
                To provide the Nigerian and African market with 100% authentic, carefully
                sourced and house-crafted fragrances — delivered with honesty, elegance and
                unmatched attention to detail, at every single touchpoint.
              </p>
            </div>
            <div className="bg-white border border-line p-10 md:p-12 animate-fade-up">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Our Vision</span>
              <h3 className="mt-4 font-serif text-2xl md:text-3xl text-ink">
                Africa&apos;s Most Trusted Fragrance House
              </h3>
              <p className="mt-5 text-sm md:text-base text-ink/70 leading-relaxed">
                To become the most trusted name in luxury perfumery across Africa — recognised
                globally for craftsmanship, integrity, and a signature scent language that is
                proudly, unmistakably our own.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="What We Stand For"
            title="The Purity Values"
            subtitle="Four principles guide every fragrance we bottle and every order we send out."
          />
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="text-center px-2">
                <span className="mx-auto block h-px w-10 bg-gold mb-5" />
                <h3 className="font-serif text-lg text-ink">{v.title}</h3>
                <p className="mt-3 text-sm text-ink/60 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why choose us */}
      <section className="py-24 bg-ink text-white">
        <Container>
          <SectionHeading
            eyebrow="Why Purity"
            title="Why Choose Us"
            subtitle="A house built on quality control, service and genuine care for every client."
            className="[&_p]:text-white/60 [&_h2]:text-white"
          />
          <div className="mt-14 grid sm:grid-cols-2 gap-x-10 gap-y-10">
            {WHY_CHOOSE_US.map((item) => (
              <div key={item.title} className="flex gap-5 border-b border-white/10 pb-8">
                <span className="font-serif text-2xl text-gold">—</span>
                <div>
                  <h3 className="font-serif text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Luxury Promise */}
      <section className="py-24">
        <Container className="grid md:grid-cols-2 gap-14 items-center">
          <div className="relative aspect-[4/5] overflow-hidden order-2 md:order-1 animate-fade-up">
            <Image
              src="https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=1000&q=80"
              alt="A single perfume bottle wrapped for gifting"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="order-1 md:order-2 animate-fade-up">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold">
              The Purity Promise
            </span>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl text-ink">Our Luxury Promise</h2>
            <p className="mt-6 text-sm md:text-base text-ink/70 leading-relaxed">
              When you order from Purity, you are promised more than a bottle. You are promised
              a full experience — from meticulous packaging finished with our signature gold
              seal, to fragrance consultation, to discreet and secure delivery.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink/70">
              <li className="flex gap-3"><span className="text-gold">✦</span> Meticulously packaged, gift-ready presentation</li>
              <li className="flex gap-3"><span className="text-gold">✦</span> Fragrance consultation before and after purchase</li>
              <li className="flex gap-3"><span className="text-gold">✦</span> Discreet, tamper-evident nationwide delivery</li>
              <li className="flex gap-3"><span className="text-gold">✦</span> A dedicated concierge for repeat clients</li>
            </ul>
          </div>
        </Container>
      </section>

      {/* Authenticity Guarantee */}
      <section className="py-24 bg-porcelain">
        <Container className="max-w-3xl text-center flex flex-col items-center">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Our Guarantee</span>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl text-ink">
            The Purity Authenticity Guarantee
          </h2>
          <p className="mt-6 text-sm md:text-base text-ink/70 leading-relaxed">
            We guarantee, without exception, that every fragrance sold under the Purity name is
            100% genuine. Each product is sourced directly from authorised distributors and
            brand-approved suppliers, or formulated in-house by our own perfumers. Every unit is
            batch-checked before it is packaged for delivery.
          </p>
          <p className="mt-4 text-sm md:text-base text-ink/70 leading-relaxed">
            Should you ever have a genuine concern about the authenticity of a Purity product,
            reach out within 48 hours of delivery and our team will investigate and resolve it —
            including a full refund or replacement where warranted. This is not a policy we hide
            in fine print; it is the foundation our entire house is built on.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button href="/shop" size="lg">Explore The Collection</Button>
            <Button href="/contact" variant="outline" size="lg">Speak To Us</Button>
          </div>
        </Container>
      </section>
    </div>
  );
}
