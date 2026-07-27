import { Container } from "@/components/ui/container";
import { FaqAccordion, type FaqCategory } from "./faq-accordion";

export const metadata = {
  title: "FAQ — Purity",
  description:
    "Answers to common questions about shipping, returns, payment, perfume care, authenticity and delivery times at Purity.",
};

const CATEGORIES: FaqCategory[] = [
  {
    category: "Shipping",
    items: [
      {
        question: "Which locations do you deliver to?",
        answer:
          "We deliver nationwide across Nigeria — from Lagos and Abuja to Port Harcourt, Kano, Enugu and every state in between. We currently do not ship outside Nigeria, but international shipping is on our roadmap.",
      },
      {
        question: "How much does shipping cost?",
        answer:
          "Shipping fees are calculated at checkout based on your delivery zone. Lagos Mainland and Island deliveries start from ₦2,500, while other states range from ₦3,500 to ₦7,000 depending on distance and carrier. Orders above ₦150,000 qualify for complimentary shipping.",
      },
      {
        question: "Can I track my order?",
        answer:
          "Yes. Once your order is packed and handed to our delivery partner, you will receive a tracking link via email and SMS. You can also check your order status anytime from your Purity account dashboard.",
      },
    ],
  },
  {
    category: "Returns",
    items: [
      {
        question: "What is your return policy?",
        answer:
          "For hygiene and safety reasons, we accept returns only on unopened, unused fragrances with the original seal, box and packaging fully intact, within 7 days of delivery. Opened or sprayed bottles cannot be returned unless the product is faulty or incorrect.",
      },
      {
        question: "How do I start a return or exchange?",
        answer:
          "Contact our support team via WhatsApp or email within 7 days of receiving your order, quoting your order number. We will confirm eligibility, arrange pickup, and process your refund or exchange once the item passes inspection.",
      },
      {
        question: "When will I receive my refund?",
        answer:
          "Approved refunds are processed back to your original payment method within 5–10 business days of us receiving and inspecting the returned item. Bank transfer refunds may take slightly longer depending on your bank.",
      },
    ],
  },
  {
    category: "Payment",
    items: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept card payments, bank transfer and USSD via Paystack and Flutterwave, our secure payment partners. We also support direct bank transfer for larger orders on request.",
      },
      {
        question: "Is it safe to pay with my card on your site?",
        answer:
          "Absolutely. All transactions are encrypted and processed through PCI-DSS compliant gateways (Paystack and Flutterwave). Purity never stores your full card details on our servers at any point.",
      },
      {
        question: "Can I pay on delivery?",
        answer:
          "Pay-on-delivery is currently available for select locations within Lagos only, for orders under ₦100,000. All other orders require full payment at checkout before dispatch.",
      },
    ],
  },
  {
    category: "Perfume Care",
    items: [
      {
        question: "How should I store my fragrance?",
        answer:
          "Store your perfume upright, away from direct sunlight, heat and humidity — a cool, dark drawer or cabinet is ideal. Avoid keeping fragrances in the bathroom or car, as fluctuating temperature and light break down the scent compounds over time.",
      },
      {
        question: "How long does a bottle of perfume last once opened?",
        answer:
          "Properly stored, most fragrances remain in excellent condition for 3–5 years after opening. You'll notice a change in colour or a flattened, altered scent when a perfume has started to turn — that's your cue to replace it.",
      },
      {
        question: "What is the best way to apply fragrance for longevity?",
        answer:
          "Apply to pulse points — wrists, neck, behind the ears — straight after a shower when pores are open, and avoid rubbing your wrists together as this breaks down the top notes. A light layer on clothing can also help scent last longer through the day.",
      },
    ],
  },
  {
    category: "Authenticity",
    items: [
      {
        question: "How do I know your perfumes are genuine?",
        answer:
          "Every fragrance we sell is sourced directly from authorised distributors and brand-approved suppliers, or formulated in-house by our own perfumers. Each unit is batch-checked before dispatch, and we back every sale with our Purity Authenticity Guarantee.",
      },
      {
        question: "Do you sell decants or testers?",
        answer:
          "No. Purity sells only full, sealed, factory-boxed bottles. We do not sell decants, splash samples, or units repackaged from larger bottles, ensuring the fragrance you receive is exactly as the house intended.",
      },
      {
        question: "What happens if I receive a product I believe is not authentic?",
        answer:
          "Contact us within 48 hours of delivery with photos of the product and packaging. Our team will investigate immediately, and where a concern is verified, we will offer a full refund or a like-for-like replacement at no cost to you.",
      },
    ],
  },
  {
    category: "Delivery Times",
    items: [
      {
        question: "How long does delivery take within Lagos?",
        answer:
          "Orders within Lagos are typically delivered within 1–2 business days of dispatch. Same-day delivery is available for orders placed before 12 PM on business days, subject to a small express fee.",
      },
      {
        question: "How long does delivery take outside Lagos?",
        answer:
          "Deliveries to other states typically arrive within 2–5 business days, depending on your location and the delivery partner serving that region. Remote areas may take up to 7 business days.",
      },
      {
        question: "Do you deliver on weekends and public holidays?",
        answer:
          "Saturday deliveries are available in select cities. We do not dispatch on Sundays or public holidays, though our WhatsApp line remains open for order enquiries and your order will be processed on the next business day.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="bg-ivory">
      <section className="py-24 md:py-28">
        <Container className="flex flex-col items-center text-center">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold animate-fade-up">
            Support
          </span>
          <h1 className="mt-5 font-serif text-4xl md:text-5xl text-ink animate-fade-up">
            Frequently Asked Questions
          </h1>
          <p className="mt-5 max-w-xl text-sm md:text-base text-ink/60 leading-relaxed animate-fade-up">
            Everything you need to know about shopping with Purity — from shipping and returns
            to caring for your fragrance collection.
          </p>
        </Container>
      </section>

      <section className="pb-28">
        <Container className="max-w-4xl">
          <FaqAccordion categories={CATEGORIES} />
        </Container>
      </section>
    </div>
  );
}
