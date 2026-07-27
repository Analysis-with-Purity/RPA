const STATS = [
  { value: "12M+", label: "Tickets resolved" },
  { value: "2 min", label: "Avg. first response" },
  { value: "98%", label: "Customer satisfaction" },
  { value: "99.99%", label: "Platform uptime" },
];

export function StatsBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-6 rounded-2xl border bg-card p-8 sm:p-10 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
