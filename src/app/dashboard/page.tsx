import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [orderCount, wishlistCount, addressCount, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.address.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: true },
    }),
  ]);

  const stats = [
    { label: "Orders Placed", value: orderCount, href: "/dashboard/orders" },
    { label: "Wishlist Items", value: wishlistCount, href: "/dashboard/wishlist" },
    { label: "Saved Addresses", value: addressCount, href: "/dashboard/addresses" },
  ];

  return (
    <div className="space-y-10">
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-line p-6 hover:border-gold transition-colors"
          >
            <p className="font-serif text-3xl text-royal">{s.value}</p>
            <p className="text-xs uppercase tracking-[0.14em] text-ink/50 mt-2">{s.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-xs uppercase tracking-wide text-royal">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white border border-line p-10 text-center text-sm text-ink/50">
            You haven&apos;t placed any orders yet.{" "}
            <Link href="/shop" className="text-royal underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-line divide-y divide-line">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-5 hover:bg-ivory/60 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-ink/50 mt-1">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{formatNaira(order.total)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-gold mt-1">{order.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
