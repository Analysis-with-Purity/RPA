import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-8rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1541643600914-78b084683601?w=1400&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <Link href="/" className="relative font-serif text-2xl tracking-[0.08em]">
          PURITY
        </Link>
        <blockquote className="relative font-serif text-3xl leading-snug max-w-md">
          &ldquo;A fragrance is not worn — it is remembered.&rdquo;
          <span className="block mt-4 text-xs tracking-[0.2em] uppercase text-gold not-italic">
            The Purity Promise
          </span>
        </blockquote>
      </div>

      <div className="flex items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-sm animate-fade-up">
          <h1 className="font-serif text-3xl mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-ink/60 mb-8">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
