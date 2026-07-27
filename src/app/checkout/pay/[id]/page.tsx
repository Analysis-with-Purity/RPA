"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/container";

const METHOD_LABELS: Record<string, string> = {
  PAYSTACK: "Paystack",
  FLUTTERWAVE: "Flutterwave",
  CARD: "Card Payment",
  BANK_TRANSFER: "Bank Transfer",
};

export default function PaySimulationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <PaySimulationInner params={params} />
    </Suspense>
  );
}

function PaySimulationInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get("method") ?? "PAYSTACK";
  const reference = searchParams.get("ref") ?? undefined;
  const [step, setStep] = useState<"redirecting" | "processing" | "success">("redirecting");

  useEffect(() => {
    const t1 = setTimeout(() => setStep("processing"), 1200);
    const t2 = setTimeout(async () => {
      await fetch(`/api/orders/${id}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      setStep("success");
      setTimeout(() => router.push(`/order-confirmation/${id}`), 900);
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-ink text-white">
      <Container className="max-w-md text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-6">Secure Payment</p>
        <div className="mx-auto mb-8 h-14 w-14 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        <h1 className="font-serif text-2xl">
          {step === "redirecting" && `Connecting to ${METHOD_LABELS[method]}…`}
          {step === "processing" && "Confirming your payment…"}
          {step === "success" && "Payment Successful"}
        </h1>
        <p className="text-white/50 text-sm mt-3">
          Please do not close or refresh this window.
        </p>
        <p className="text-white/30 text-xs mt-8">
          Test mode — simulating a {METHOD_LABELS[method]} transaction.
        </p>
      </Container>
    </div>
  );
}
