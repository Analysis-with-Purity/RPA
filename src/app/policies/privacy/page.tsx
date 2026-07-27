import { PolicyLayout } from "@/components/policy/policy-layout";

export const metadata = {
  title: "Privacy Policy — Purity",
  description: "How Purity collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout eyebrow="Policies" title="Privacy Policy" updated="July 1, 2026">
      <section>
        <h2>1. Overview</h2>
        <p>
          Purity Luxury Fragrance House (&ldquo;Purity&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;) respects your privacy and is committed to protecting your personal
          information. This Privacy Policy explains what data we collect, how we use it, and the
          choices you have, in line with the Nigeria Data Protection Act (NDPA) 2023.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> name, email address, phone number, and password
            (stored securely as a hash, never in plain text).
          </li>
          <li>
            <strong>Order information:</strong> delivery address, billing details, order history
            and payment status (payment card details are handled directly by our payment
            processors and are never stored on our servers).
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, device and browser type, and interactions
            with the Platform, collected via cookies and similar technologies.
          </li>
          <li>
            <strong>Communications:</strong> messages you send us via our contact form,
            WhatsApp, email or social channels.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To process, fulfil and deliver your orders.</li>
          <li>To communicate order updates, respond to enquiries, and provide customer support.</li>
          <li>To personalise your shopping experience and recommend relevant fragrances.</li>
          <li>To send marketing communications, only where you have opted in (you can unsubscribe at any time).</li>
          <li>To detect, prevent and investigate fraud or misuse of the Platform.</li>
          <li>To comply with legal and regulatory obligations.</li>
        </ul>
      </section>

      <section>
        <h2>4. Sharing of Information</h2>
        <p>
          We do not sell your personal information. We share limited data only with trusted
          third parties strictly necessary to operate our business, including:
        </p>
        <ul>
          <li>Payment processors (Paystack, Flutterwave) to complete transactions securely.</li>
          <li>Logistics and delivery partners, to fulfil and track your orders.</li>
          <li>Email and SMS providers, to send order and marketing communications.</li>
          <li>Regulatory or law enforcement bodies, where required by law.</li>
        </ul>
      </section>

      <section>
        <h2>5. Cookies</h2>
        <p>
          We use cookies and similar technologies to keep you signed in, remember items in your
          bag, and understand how the Platform is used so we can improve it. You can control
          cookie preferences through your browser settings, though disabling cookies may affect
          site functionality.
        </p>
      </section>

      <section>
        <h2>6. Data Security</h2>
        <p>
          We apply industry-standard technical and organisational measures — including
          encryption in transit, access controls, and secure hosting — to protect your personal
          information against unauthorised access, loss, or misuse. No method of transmission or
          storage is completely secure, but we continuously work to safeguard your data.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain personal information for as long as necessary to fulfil the purposes outlined
          in this policy, including to meet legal, accounting, or reporting requirements, after
          which it is securely deleted or anonymised.
        </p>
      </section>

      <section>
        <h2>8. Your Rights</h2>
        <p>Subject to applicable law, you have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you.</li>
          <li>Request correction of inaccurate or incomplete data.</li>
          <li>Request deletion of your personal information, subject to legal retention requirements.</li>
          <li>Withdraw consent to marketing communications at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:hello@purity-parfums.com">hello@purity-parfums.com</a>.
        </p>
      </section>

      <section>
        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Platform is not directed at individuals under the age of 18, and we do not
          knowingly collect personal information from minors.
        </p>
      </section>

      <section>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically to reflect changes in our practices or
          legal requirements. The &ldquo;Last updated&rdquo; date at the top of this page
          indicates when it was most recently revised.
        </p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>
          For any questions or concerns about this Privacy Policy or how your data is handled,
          please reach us at{" "}
          <a href="mailto:hello@purity-parfums.com">hello@purity-parfums.com</a> or via our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
