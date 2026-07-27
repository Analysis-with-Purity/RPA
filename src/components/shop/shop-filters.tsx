"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOptions {
  fragranceFamilies: string[];
  longevities: string[];
  projections: string[];
  brands: { name: string; slug: string }[];
  sizes: number[];
}

const GENDERS = ["MEN", "WOMEN", "UNISEX"];
const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "All Seasons"];
const OCCASIONS = ["Office", "Date Night", "Everyday", "Evening/Night Out", "Special Occasion", "Casual"];

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-line py-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink">{title}</span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4 space-y-2">{children}</div>}
    </div>
  );
}

export function ShopFilters({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function isActive(key: string, value: string) {
    return searchParams.get(key) === value;
  }

  function clearAll() {
    router.push(pathname);
  }

  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== "q");

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif text-lg">Filters</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-[11px] uppercase text-royal underline">
            Clear all
          </button>
        )}
      </div>

      <FilterGroup title="Gender">
        {GENDERS.map((g) => (
          <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("gender", g)}
              onChange={() => update("gender", g)}
              className="accent-royal"
            />
            {g.charAt(0) + g.slice(1).toLowerCase()}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {options.brands.map((b) => (
          <label key={b.slug} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("brand", b.slug)}
              onChange={() => update("brand", b.slug)}
              className="accent-royal"
            />
            {b.name}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Fragrance Family">
        {options.fragranceFamilies.map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("family", f)}
              onChange={() => update("family", f)}
              className="accent-royal"
            />
            {f}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Size">
        <div className="flex gap-2 flex-wrap">
          {options.sizes.map((s) => (
            <button
              key={s}
              onClick={() => update("size", String(s))}
              className={cn(
                "border px-3 py-1.5 text-xs",
                isActive("size", String(s)) ? "border-royal text-royal" : "border-line text-ink/60"
              )}
            >
              {s}ml
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price Range">
        <div className="flex flex-col gap-2">
          {[
            ["0", "50000", "Under ₦50,000"],
            ["50000", "100000", "₦50,000 – ₦100,000"],
            ["100000", "180000", "₦100,000 – ₦180,000"],
            ["180000", "500000", "₦180,000+"],
          ].map(([min, max, label]) => (
            <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={searchParams.get("minPrice") === min && searchParams.get("maxPrice") === max}
                onChange={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (params.get("minPrice") === min && params.get("maxPrice") === max) {
                    params.delete("minPrice");
                    params.delete("maxPrice");
                  } else {
                    params.set("minPrice", min);
                    params.set("maxPrice", max);
                  }
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="accent-royal"
              />
              {label}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Longevity">
        {options.longevities.map((l) => (
          <label key={l} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("longevity", l)}
              onChange={() => update("longevity", l)}
              className="accent-royal"
            />
            {l}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Projection">
        {options.projections.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("projection", p)}
              onChange={() => update("projection", p)}
              className="accent-royal"
            />
            {p}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Season">
        {SEASONS.map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("season", s)}
              onChange={() => update("season", s)}
              className="accent-royal"
            />
            {s}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Occasion">
        {OCCASIONS.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("occasion", o)}
              onChange={() => update("occasion", o)}
              className="accent-royal"
            />
            {o}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Rating">
        {[4, 3, 2].map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive("minRating", String(r))}
              onChange={() => update("minRating", String(r))}
              className="accent-royal"
            />
            {r}+ Stars
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive("inStock", "1")}
            onChange={() => update("inStock", "1")}
            className="accent-royal"
          />
          In Stock Only
        </label>
      </FilterGroup>
    </aside>
  );
}
