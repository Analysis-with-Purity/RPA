import { StarIcon } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We cut our first-response time by 63% in the first month. The AI triage alone paid for the whole plan.",
    name: "Amara Okafor",
    role: "Head of Support, Northwind",
    initials: "AO",
  },
  {
    quote:
      "Our agents finally have one place for everything. Onboarding a new hire went from weeks to days.",
    name: "David Chen",
    role: "CX Lead, Globex",
    initials: "DC",
  },
  {
    quote:
      "The analytics gave our execs the visibility they always wanted. CSAT is up 14 points since we switched.",
    name: "Sofia Marino",
    role: "VP Operations, Initech",
    initials: "SM",
  },
];

export function TestimonialsSection() {
  return (
    <section id="customers" className="scroll-mt-20 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Loved by teams</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Don&apos;t just take our word for it
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col rounded-xl border bg-card p-6"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-pretty">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {testimonial.initials}
                </span>
                <span>
                  <span className="block text-sm font-medium">{testimonial.name}</span>
                  <span className="block text-xs text-muted-foreground">{testimonial.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
