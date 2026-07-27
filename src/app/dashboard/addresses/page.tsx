import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/dashboard/address-manager";

export default async function AddressesPage() {
  const session = await auth();
  const addresses = await prisma.address.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-xl">Delivery Addresses</h2>
          <p className="text-sm text-ink/50 mt-1">Manage where we deliver your orders.</p>
        </div>
      </div>
      <AddressManager initialAddresses={JSON.parse(JSON.stringify(addresses))} />
    </div>
  );
}
