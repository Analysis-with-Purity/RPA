import { ShieldCheck, Truck, Gem, Undo2 } from "lucide-react";
import { Container } from "@/components/ui/container";

const ITEMS = [
  { icon: ShieldCheck, label: "Authenticity Guaranteed" },
  { icon: Truck, label: "Nationwide Delivery" },
  { icon: Gem, label: "Curated Luxury Selection" },
  { icon: Undo2, label: "Easy 7-Day Returns" },
];

export function TrustStrip() {
  return (
    <div className="border-y border-line bg-ivory">
      <Container className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 justify-center md:justify-start">
            <Icon size={20} strokeWidth={1.2} className="text-gold shrink-0" />
            <span className="text-xs uppercase tracking-[0.1em] text-ink/70">{label}</span>
          </div>
        ))}
      </Container>
    </div>
  );
}
