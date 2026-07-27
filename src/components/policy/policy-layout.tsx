import { Container } from "@/components/ui/container";

export function PolicyLayout({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ivory">
      <section className="py-24 md:py-28">
        <Container className="max-w-3xl">
          <div className="flex flex-col items-center text-center animate-fade-up">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold">{eyebrow}</span>
            <h1 className="mt-5 font-serif text-4xl md:text-5xl text-ink">{title}</h1>
            <span className="mt-5 h-px w-16 bg-gold" />
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink/40">
              Last updated: {updated}
            </p>
          </div>

          <div
            className={[
              "mt-16 space-y-10 text-sm md:text-base leading-[1.9] text-ink/70",
              "[&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-ink [&_h2]:mb-4",
              "[&_h3]:font-serif [&_h3]:text-lg [&_h3]:text-ink [&_h3]:mt-6 [&_h3]:mb-2",
              "[&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mb-4",
              "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol]:mb-4",
              "[&_strong]:text-ink [&_strong]:font-semibold",
              "[&_a]:text-royal [&_a]:underline [&_a]:underline-offset-2",
            ].join(" ")}
          >
            {children}
          </div>
        </Container>
      </section>
    </div>
  );
}
