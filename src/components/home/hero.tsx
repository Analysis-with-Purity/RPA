import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[560px] overflow-hidden bg-ink">
      <div
        className="absolute inset-0 animate-ken-burns"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
      <div className="absolute inset-0 bg-ink/10" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        <span className="animate-fade-up text-[11px] md:text-xs uppercase tracking-[0.4em] text-gold mb-6">
          The Purity Fragrance House
        </span>
        <h1
          className="animate-fade-up font-serif text-4xl sm:text-5xl md:text-7xl text-white leading-[1.1] max-w-4xl"
          style={{ animationDelay: "0.1s" }}
        >
          Where Elegance
          <br />
          Becomes Signature
        </h1>
        <p
          className="animate-fade-up mt-6 text-sm md:text-base text-white/70 max-w-md leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          Discover a collection of rare, luxurious fragrances crafted for those who
          understand that true sophistication is quiet, unmistakable, and entirely their own.
        </p>
        <div
          className="animate-fade-up mt-10 flex flex-col sm:flex-row items-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <Button href="/shop" variant="primary" size="lg">
            Shop Now
          </Button>
          <Button href="/collections" variant="outline" size="lg" className="border-white/50 text-white hover:bg-white hover:text-ink">
            Explore Collections
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-fade-up" style={{ animationDelay: "0.5s" }}>
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-8 w-px bg-white/40" />
      </div>
    </section>
  );
}
