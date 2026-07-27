import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { Badge, GoldBadge } from "@/components/ui/badge";

export default async function PaymentsPage() {
  const session = await auth();
  const orders = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-serif text-xl mb-6">Payment History</h2>

      {orders.length === 0 ? (
        <div className="bg-white border border-line p-10 text-center text-sm text-ink/50">
          No payments recorded yet.
        </div>
      ) : (
        <div className="bg-white border border-line overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink/40">
                <th className="p-4">Order</th>
                <th className="p-4">Date</th>
                <th className="p-4">Method</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium">{order.orderNumber}</td>
                  <td className="p-4 text-ink/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-ink/60">{order.paymentMethod.replace("_", " ")}</td>
                  <td className="p-4">
                    {order.paymentStatus === "PAID" ? (
                      <GoldBadge>Paid</GoldBadge>
                    ) : order.paymentStatus === "PENDING" ? (
                      <Badge>Pending</Badge>
                    ) : (
                      <Badge className="border-red-300 text-red-600">{order.paymentStatus}</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">{formatNaira(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
