const COMPANIES = ["Northwind", "Acme Corp", "Globex", "Umbrella", "Initech", "Hooli"];

export function LogoCloud() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-center text-sm text-muted-foreground">
          Trusted by fast-growing support teams worldwide
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {COMPANIES.map((company) => (
            <span
              key={company}
              className="text-lg font-semibold tracking-tight text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
