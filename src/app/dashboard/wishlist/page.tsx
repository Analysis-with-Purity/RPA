import { auth } from "@/auth";
import { ProductCard } from "@/components/product/product-card";
import { getUserWishlistProducts } from "@/lib/data/products";

export default async function WishlistPage() {
  const session = await auth();
  const products = await getUserWishlistProducts(session!.user.id);

  return (
    <div>
      <h2 className="font-serif text-xl mb-6">My Wishlist</h2>
      {products.length === 0 ? (
        <div className="bg-white border border-line p-10 text-center text-sm text-ink/50">
          Your wishlist is empty. Tap the heart icon on any fragrance to save it here.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
