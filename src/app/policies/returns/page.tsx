import { PolicyLayout } from "@/components/policy/policy-layout";

export const metadata = {
  title: "Returns & Exchanges Policy — Purity",
  description: "Purity's 7-day return and exchange policy for sealed, unused fragrances.",
};

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout eyebrow="Policies" title="Returns & Exchanges" updated="July 1, 2026">
      <section>
        <h2>1. Our 7-Day Return Window</h2>
        <p>
          Because fragrance is a cosmetic product, we accept returns only on items that are{" "}
          <strong>unopened, unused, and unsprayed</strong>, with the original seal intact, the
          box undamaged, and all accompanying packaging present. Returns must be requested within{" "}
          <strong>7 days</strong> of the delivery date shown on your tracking record.
        </p>
        <p>
          This hygiene-based policy protects every customer — it ensures that no bottle offered
          for sale has ever been opened, tested, or handled by anyone outside our sealed supply
          chain.
        </p>
      </section>

      <section>
        <h2>2. What Cannot Be Returned</h2>
        <ul>
          <li>Any bottle with a broken seal, removed shrink-wrap, or missing box.</li>
          <li>Fragrances that have been sprayed, decanted, or show signs of use.</li>
          <li>Gift sets where any individual item has been opened.</li>
          <li>Items purchased on final-sale or clearance promotions, unless faulty.</li>
          <li>Requests made more than 7 days after delivery.</li>
        </ul>
      </section>

      <section>
        <h2>3. Faulty, Damaged or Incorrect Items</h2>
        <p>
          If your order arrives damaged, leaking, faulty, or different from what you ordered,
          contact us within 48 hours of delivery with clear photos of the item and its packaging.
          These cases are exempt from the &ldquo;unopened&rdquo; requirement above, and we will
          arrange a free replacement, exchange, or full refund at no cost to you.
        </p>
      </section>

      <section>
        <h2>4. How to Request a Return or Exchange</h2>
        <ol>
          <li>Contact our support team via WhatsApp or email with your order number and reason for return.</li>
          <li>Our team will confirm eligibility and issue a return authorisation along with pickup instructions.</li>
          <li>Package the item securely in its original, sealed packaging.</li>
          <li>Once received and inspected, we will process your refund or exchange within 3–5 business days.</li>
        </ol>
      </section>

      <section>
        <h2>5. Refunds</h2>
        <p>
          Approved refunds are issued to your original payment method (card, bank transfer,
          Paystack or Flutterwave wallet) within <strong>5–10 business days</strong> of approval.
          Original shipping fees are non-refundable unless the return is due to our error.
          Return shipping costs for change-of-mind returns are the responsibility of the
          customer, except where a complimentary pickup has been arranged.
        </p>
      </section>

      <section>
        <h2>6. Exchanges</h2>
        <p>
          Prefer a different size or scent? We&apos;re happy to exchange eligible, unopened items
          within the 7-day window, subject to stock availability. Any price difference will be
          charged or refunded accordingly.
        </p>
      </section>

      <section>
        <h2>7. Questions</h2>
        <p>
          Reach out to <a href="mailto:hello@purity-parfums.com">hello@purity-parfums.com</a> or
          message us on WhatsApp — we aim to respond to all return enquiries within 24 hours.
        </p>
      </section>
    </PolicyLayout>
  );
}
