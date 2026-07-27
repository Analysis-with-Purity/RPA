import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export default async function OrdersPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-serif text-xl mb-6">Orders & Tracking</h2>

      {orders.length === 0 ? (
        <div className="bg-white border border-line p-10 text-center text-sm text-ink/50">
          You haven&apos;t placed any orders yet.
        </div>
      ) : (
        <div className="bg-white border border-line divide-y divide-line">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-5 hover:bg-ivory/60 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{order.orderNumber}</p>
                <p className="text-xs text-ink/50 mt-1">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-[11px] uppercase tracking-wide text-gold">{order.status.replace(/_/g, " ")}</span>
                <p className="text-sm w-24 text-right">{formatNaira(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
