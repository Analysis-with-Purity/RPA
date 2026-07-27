import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { OrderTracker } from "@/components/order/order-tracker";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });

  if (!order || order.userId !== session!.user.id) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h2 className="font-serif text-xl">{order.orderNumber}</h2>
          <p className="text-xs text-ink/50 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-white border border-line p-6 mb-8">
        <OrderTracker status={order.status} />
      </div>

      <div className="bg-white border border-line divide-y divide-line mb-8">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-4">
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

      <div className="grid sm:grid-cols-2 gap-6 text-sm">
        <div className="bg-white border border-line p-5">
          <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-2">Delivery Address</p>
          <p>{order.fullName}</p>
          <p className="text-ink/60">{order.addressLine}, {order.city}, {order.state}</p>
          <p className="text-ink/60">{order.phone}</p>
        </div>
        <div className="bg-white border border-line p-5">
          <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-2">Payment</p>
          <p>{order.paymentMethod.replace("_", " ")}</p>
          <p className="text-royal mt-1">{order.paymentStatus}</p>
          <div className="mt-3 pt-3 border-t border-line space-y-1">
            <div className="flex justify-between"><span className="text-ink/50">Subtotal</span><span>{formatNaira(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-royal"><span>Discount</span><span>−{formatNaira(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-ink/50">Shipping</span><span>{order.shippingFee === 0 ? "Free" : formatNaira(order.shippingFee)}</span></div>
            <div className="flex justify-between font-medium pt-1 border-t border-line"><span>Total</span><span>{formatNaira(order.total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
