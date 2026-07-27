"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMounted } from "@/lib/hooks/use-mounted";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { NIGERIAN_STATES } from "@/lib/nigerian-states";
import { formatNaira } from "@/lib/utils";
import { calculateTotals } from "@/lib/cart-pricing";
import { cn } from "@/lib/utils";

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const PAYMENT_METHODS = [
  { value: "PAYSTACK", label: "Paystack", hint: "Pay with card, bank or USSD" },
  { value: "FLUTTERWAVE", label: "Flutterwave", hint: "Pay with card, bank or mobile money" },
  { value: "CARD", label: "Debit / Credit Card", hint: "Visa, Mastercard, Verve" },
  { value: "BANK_TRANSFER", label: "Bank Transfer", hint: "Direct transfer with instant confirmation" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const mounted = useMounted();

  const lines = useCartStore((s) => s.lines);
  const promo = useCartStore((s) => s.promo);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clear);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    deliveryOption: "Standard" as "Standard" | "Express",
    paymentMethod: "PAYSTACK" as "PAYSTACK" | "FLUTTERWAVE" | "CARD" | "BANK_TRANSFER",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefilling from an async session/API response, not derivable during render
      setForm((f) => ({ ...f, fullName: session.user.name ?? "", email: session.user.email ?? "" }));
      fetch("/api/account/addresses")
        .then((r) => r.json())
        .then((data) => {
          setAddresses(data.addresses ?? []);
          const def = data.addresses?.find((a: SavedAddress) => a.isDefault);
          if (def) applyAddress(def);
        });
    }
  }, [session]);

  function applyAddress(addr: SavedAddress) {
    setSelectedAddressId(addr.id);
    setForm((f) => ({
      ...f,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine: addr.line1,
      city: addr.city,
      state: addr.state,
    }));
  }

  const { discount, shippingFee, total } = calculateTotals(subtotal, promo, form.deliveryOption);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        addressId: selectedAddressId !== "new" ? selectedAddressId : undefined,
        promoCode: promo?.code,
        items: lines.map((l) => ({
          kind: l.kind,
          refId: l.refId,
          sizeId: l.sizeId,
          name: l.name,
          brand: l.brand,
          sizeLabel: l.sizeLabel,
          image: l.image,
          price: l.price,
          quantity: l.quantity,
        })),
      }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      return;
    }

    clearCart();
    router.push(`/checkout/pay/${json.orderId}?method=${form.paymentMethod}`);
  }

  if (!mounted) return <div className="min-h-[60vh]" />;

  if (lines.length === 0) {
    return (
      <Container className="py-24 text-center">
        <p className="text-ink/50 mb-6">Your bag is empty — add something beautiful first.</p>
        <Button href="/shop">Shop Fragrances</Button>
      </Container>
    );
  }

  return (
    <div className="bg-white">
      <div className="bg-ivory border-b border-line py-10">
        <Container>
          <h1 className="font-serif text-3xl">Checkout</h1>
        </Container>
      </div>

      <Container className="py-12">
        {status !== "authenticated" && (
          <div className="mb-8 border border-line bg-porcelain px-5 py-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-ink/70">Checking out as a guest.</p>
            <Link href="/login?callbackUrl=/checkout" className="text-xs uppercase tracking-wide text-royal underline">
              Login for faster checkout
            </Link>
          </div>
        )}

        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-14">
          <div className="space-y-10">
            {addresses.length > 0 && (
              <div>
                <h2 className="font-serif text-xl mb-4">Choose an Address</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <button
                      type="button"
                      key={addr.id}
                      onClick={() => applyAddress(addr)}
                      className={cn(
                        "text-left border p-4 text-sm",
                        selectedAddressId === addr.id ? "border-royal" : "border-line"
                      )}
                    >
                      <p className="font-medium">{addr.fullName}</p>
                      <p className="text-ink/50 mt-1">
                        {addr.line1}, {addr.city}, {addr.state}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId("new");
                      setForm((f) => ({ ...f, addressLine: "", city: "", state: "" }));
                    }}
                    className={cn(
                      "text-left border p-4 text-sm",
                      selectedAddressId === "new" ? "border-royal" : "border-line"
                    )}
                  >
                    + Use a new address
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="font-serif text-xl mb-4">Contact & Delivery Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="addressLine">Delivery Address</Label>
                <Input
                  id="addressLine"
                  required
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-royal"
                  >
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl mb-4">Delivery Option</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(["Standard", "Express"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "border p-4 cursor-pointer flex items-center justify-between",
                      form.deliveryOption === opt ? "border-royal" : "border-line"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{opt}</p>
                      <p className="text-xs text-ink/50">
                        {opt === "Standard" ? "3–5 business days" : "1–2 business days"}
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="deliveryOption"
                      checked={form.deliveryOption === opt}
                      onChange={() => setForm({ ...form, deliveryOption: opt })}
                      className="accent-royal"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-xl mb-4">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={cn(
                      "border p-4 cursor-pointer flex items-center justify-between",
                      form.paymentMethod === pm.value ? "border-royal" : "border-line"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">{pm.label}</p>
                      <p className="text-xs text-ink/50">{pm.hint}</p>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={form.paymentMethod === pm.value}
                      onChange={() => setForm({ ...form, paymentMethod: pm.value as typeof form.paymentMethod })}
                      className="accent-royal"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[11px] text-ink/40 mt-3">
                🔒 Payments are processed securely. This environment runs in test mode — no real charge will occur.
              </p>
            </div>
          </div>

          <div>
            <div className="bg-ivory p-6 space-y-4 sticky top-24">
              <h2 className="font-serif text-lg">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lines.map((line) => (
                  <div key={line.key} className="flex gap-3 items-center">
                    <div className="relative w-12 h-14 shrink-0 bg-white">
                      <Image src={line.image} alt={line.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{line.name}</p>
                      <p className="text-xs text-ink/40">{line.sizeLabel} × {line.quantity}</p>
                    </div>
                    <p className="text-sm">{formatNaira(line.price * line.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm pt-3 border-t border-line">
                <div className="flex justify-between">
                  <span className="text-ink/60">Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-royal">
                    <span>Discount</span>
                    <span>−{formatNaira(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink/60">Shipping</span>
                  <span>{shippingFee === 0 ? "Free" : formatNaira(shippingFee)}</span>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t border-line font-medium text-base">
                <span>Total</span>
                <span>{formatNaira(total)}</span>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Placing Order…" : "Pay Now"}
              </Button>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
