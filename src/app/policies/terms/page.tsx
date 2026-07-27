import { PolicyLayout } from "@/components/policy/policy-layout";

export const metadata = {
  title: "Terms of Service — Purity",
  description: "The terms and conditions governing use of the Purity website and purchases.",
};

export default function TermsPolicyPage() {
  return (
    <PolicyLayout eyebrow="Policies" title="Terms of Service" updated="July 1, 2026">
      <section>
        <h2>1. Introduction</h2>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
          Purity website, mobile experience, and any related services (collectively, the
          &ldquo;Platform&rdquo;), operated by Purity Luxury Fragrance House
          (&ldquo;Purity&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By browsing the Platform,
          creating an account, or placing an order, you agree to be bound by these Terms. If you
          do not agree, please discontinue use of the Platform.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old, or the age of legal majority in your jurisdiction,
          to create an account or place an order on Purity. By using the Platform, you represent
          that you meet this requirement and that all information you provide is accurate and
          current.
        </p>
      </section>

      <section>
        <h2>3. Products &amp; Pricing</h2>
        <p>
          All fragrances listed are subject to availability. Prices are displayed in Nigerian
          Naira (₦) and are inclusive of applicable taxes unless stated otherwise. We reserve the
          right to correct pricing errors, modify prices, or discontinue products at any time
          without prior notice. In the rare event of a pricing error on a confirmed order, we
          will contact you before proceeding.
        </p>
      </section>

      <section>
        <h2>4. Orders &amp; Payment</h2>
        <p>
          Placing an order constitutes an offer to purchase, which we may accept or decline at
          our discretion (for example, in cases of suspected fraud or stock unavailability).
          Payments are processed securely through our partners, Paystack and Flutterwave. Full
          payment is required before an order is dispatched, except where pay-on-delivery has
          been explicitly offered.
        </p>
      </section>

      <section>
        <h2>5. Shipping &amp; Returns</h2>
        <p>
          Delivery timelines and fees are governed by our{" "}
          <a href="/policies/shipping">Shipping Policy</a>. Returns and exchanges are governed by
          our <a href="/policies/returns">Returns Policy</a>, both of which form part of these
          Terms by reference.
        </p>
      </section>

      <section>
        <h2>6. Intellectual Property</h2>
        <p>
          All content on the Platform — including but not limited to the Purity name, logo,
          product photography, fragrance descriptions, and site design — is the property of
          Purity Luxury Fragrance House and protected by applicable intellectual property laws.
          No content may be reproduced, distributed, or used commercially without our prior
          written consent.
        </p>
      </section>

      <section>
        <h2>7. Account Responsibility</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activity that occurs under your account. Notify us immediately at{" "}
          <a href="mailto:hello@purity-parfums.com">hello@purity-parfums.com</a> if you suspect
          unauthorised access.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Purity shall not be liable for any indirect,
          incidental, or consequential damages arising from your use of the Platform or products
          purchased through it. Our total liability for any claim shall not exceed the amount you
          paid for the relevant order.
        </p>
      </section>

      <section>
        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of the Federal
          Republic of Nigeria. Any disputes arising under these Terms shall be subject to the
          exclusive jurisdiction of the courts of Lagos State.
        </p>
      </section>

      <section>
        <h2>10. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time to reflect changes in our practices or for
          legal reasons. Material changes will be communicated via the Platform, and continued
          use after such changes constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:hello@purity-parfums.com">hello@purity-parfums.com</a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
