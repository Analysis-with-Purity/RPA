import { PolicyLayout } from "@/components/policy/policy-layout";

export const metadata = {
  title: "Shipping Policy — Purity",
  description: "Purity's shipping zones, delivery timelines, fees and order handling policy.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout eyebrow="Policies" title="Shipping Policy" updated="July 1, 2026">
      <section>
        <h2>1. Order Processing</h2>
        <p>
          All orders are processed within <strong>1–2 business days</strong> of payment
          confirmation. Orders placed after 3:00 PM WAT, or on weekends and public holidays, are
          processed on the next available business day. During peak periods (festive seasons,
          promotional sales), processing may take up to 3 business days.
        </p>
        <p>
          Every order is quality-checked and sealed by our packaging team before it is handed to
          our delivery partners, so please allow the stated processing window before contacting
          us about a delay.
        </p>
      </section>

      <section>
        <h2>2. Delivery Zones &amp; Estimated Timelines</h2>
        <p>We currently deliver exclusively within Nigeria, split into the following zones:</p>
        <ul>
          <li>
            <strong>Zone 1 — Lagos (Island &amp; Mainland):</strong> 1–2 business days after
            dispatch. Same-day delivery available for orders placed before 12:00 PM, subject to
            an express fee.
          </li>
          <li>
            <strong>Zone 2 — Abuja, Ibadan, Port Harcourt, Benin City:</strong> 2–4 business days
            after dispatch.
          </li>
          <li>
            <strong>Zone 3 — Other states (Kano, Enugu, Kaduna, Calabar and beyond):</strong> 3–7
            business days after dispatch, depending on the courier network serving that region.
          </li>
        </ul>
        <p>
          These are estimates, not guarantees. Weather, courier capacity and address accuracy can
          all affect final delivery time.
        </p>
      </section>

      <section>
        <h2>3. Shipping Fees</h2>
        <p>Shipping costs are calculated automatically at checkout based on delivery zone and order weight. As a guide:</p>
        <ul>
          <li>Zone 1 (Lagos): from ₦2,500</li>
          <li>Zone 2: from ₦3,500</li>
          <li>Zone 3: from ₦5,000 – ₦7,000</li>
        </ul>
        <p>
          Orders with a subtotal of ₦150,000 or more qualify for complimentary standard shipping
          anywhere within Nigeria. Express and same-day delivery options are always charged
          separately, regardless of order value.
        </p>
      </section>

      <section>
        <h2>4. Order Tracking</h2>
        <p>
          Once your order is dispatched, you will receive a shipping confirmation via email and
          SMS containing a tracking reference. You can also view live status from the “My
          Orders” section of your Purity account.
        </p>
      </section>

      <section>
        <h2>5. Delivery Attempts &amp; Address Accuracy</h2>
        <p>
          Please ensure your delivery address and phone number are accurate and reachable at the
          point of checkout — our couriers will attempt to contact you before delivery. Purity is
          not responsible for delays or non-delivery arising from incorrect or incomplete address
          information supplied by the customer.
        </p>
        <p>
          If a delivery attempt fails due to the recipient being unavailable, a second attempt
          will be made at no extra cost. Subsequent failed attempts may attract a re-delivery
          fee.
        </p>
      </section>

      <section>
        <h2>6. Discreet Packaging</h2>
        <p>
          All Purity orders are shipped in neutral, tamper-evident outer packaging with no
          visible branding, for your privacy and security during transit.
        </p>
      </section>

      <section>
        <h2>7. Questions</h2>
        <p>
          For any shipping enquiries, reach our concierge team on WhatsApp or at{" "}
          <a href="mailto:hello@purity-parfums.com">hello@purity-parfums.com</a>, quoting your
          order number.
        </p>
      </section>
    </PolicyLayout>
  );
}
