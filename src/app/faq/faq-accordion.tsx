"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { question: string; answer: string };
export type FaqCategory = { category: string; items: FaqItem[] };

export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="space-y-16">
      {categories.map((cat) => (
        <div key={cat.category}>
          <h2 className="font-serif text-2xl md:text-3xl text-ink mb-1">{cat.category}</h2>
          <span className="block h-px w-12 bg-gold mb-6" />
          <div className="divide-y divide-line border-t border-b border-line">
            {cat.items.map((item, i) => {
              const key = `${cat.category}-${i}`;
              const isOpen = openKey === key;
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="font-serif text-base md:text-lg text-ink">{item.question}</span>
                    <ChevronDown
                      size={18}
                      strokeWidth={1.4}
                      className={cn(
                        "shrink-0 text-royal transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="pb-6 text-sm md:text-base text-ink/65 leading-relaxed max-w-3xl">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
