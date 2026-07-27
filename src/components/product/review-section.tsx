"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { StarRating } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReviewData {
  id: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string | Date;
  user: { name: string };
}

export function ReviewSection({
  productId,
  reviews,
  avgRating,
}: {
  productId: string;
  reviews: ReviewData[];
  avgRating: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState(reviews);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, comment }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      return;
    }
    setLocalReviews([{ ...json.review, user: { name: session.user?.name ?? "You" } }, ...localReviews]);
    setShowForm(false);
    setTitle("");
    setComment("");
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl">Customer Reviews</h2>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={avgRating} size={16} />
            <span className="text-sm text-ink/50">
              {localReviews.length} review{localReviews.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          Write a Review
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="border border-line p-6 mb-10 space-y-4 max-w-xl">
          <div>
            <Label>Your Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star
                    size={22}
                    strokeWidth={1.2}
                    className={cn(n <= rating ? "fill-gold text-gold" : "text-line")}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="reviewTitle">Title</Label>
            <Input id="reviewTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="reviewComment">Your Review</Label>
            <Textarea
              id="reviewComment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Review"}
          </Button>
        </form>
      )}

      {localReviews.length === 0 ? (
        <p className="text-sm text-ink/50">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {localReviews.map((r) => (
            <div key={r.id} className="border-b border-line pb-6">
              <div className="flex items-center gap-3 mb-2">
                <StarRating rating={r.rating} size={13} />
                {r.verifiedPurchase && <Badge className="border-gold text-gold">Verified Purchase</Badge>}
              </div>
              <h4 className="font-medium text-sm">{r.title}</h4>
              <p className="text-sm text-ink/60 mt-1 leading-relaxed">{r.comment}</p>
              <p className="text-xs text-ink/40 mt-2">
                {r.user.name} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
