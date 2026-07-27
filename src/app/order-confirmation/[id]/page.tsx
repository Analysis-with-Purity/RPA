import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { OrderTracker } from "@/components/order/order-tracker";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="bg-white">
      <div className="bg-ivory border-b border-line py-16 text-center">
        <Container>
          <CheckCircle2 size={44} strokeWidth={1.2} className="text-royal mx-auto mb-4" />
          <h1 className="font-serif text-3xl">Thank You, {order.fullName.split(" ")[0]}</h1>
          <p className="text-ink/60 mt-2">
            Your order <strong>{order.orderNumber}</strong> has been confirmed.
          </p>
        </Container>
      </div>

      <Container className="py-14 max-w-3xl">
        <OrderTracker status={order.status} />

        <div className="mt-12 divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4">
              <div className="relative w-14 h-16 shrink-0 bg-porcelain">
                <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-ink/40">{item.sizeLabel} × {item.quantity}</p>
              </div>
              <p className="text-sm">{formatNaira(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-ink/60">Subtotal</span>
            <span>{formatNaira(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-royal">
              <span>Discount</span>
              <span>−{formatNaira(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink/60">Shipping</span>
            <span>{order.shippingFee === 0 ? "Free" : formatNaira(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t border-line">
            <span>Total</span>
            <span>{formatNaira(order.total)}</span>
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 gap-6 text-sm">
          <div className="border border-line p-5">
            <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-2">Delivery Address</p>
            <p>{order.fullName}</p>
            <p className="text-ink/60">{order.addressLine}, {order.city}, {order.state}</p>
            <p className="text-ink/60">{order.phone}</p>
          </div>
          <div className="border border-line p-5">
            <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-2">Payment</p>
            <p>{order.paymentMethod.replace("_", " ")}</p>
            <p className="text-royal mt-1">{order.paymentStatus}</p>
          </div>
        </div>

        <div className="mt-12 text-center flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/shop" variant="outline">Continue Shopping</Button>
          {order.userId && <Button href="/dashboard/orders">View My Orders</Button>}
        </div>

        <p className="text-center text-xs text-ink/40 mt-6">
          A confirmation email has been sent to <Link href="#" className="underline">{order.email}</Link>.
        </p>
      </Container>
    </div>
  );
}
