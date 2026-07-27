import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How long is the free trial?",
    a: "Every plan starts with a full 14-day free trial with access to all features. No credit card is required to start, and you can cancel anytime.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. You can explore the entire platform during your trial without entering any payment details. We'll only ask for a card when you're ready to subscribe.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade, downgrade, or switch between monthly and annual billing at any time from your account settings. Changes are prorated automatically.",
  },
  {
    q: "How does the AI assistant work?",
    a: "Our AI reads incoming tickets, suggests the right category and priority, drafts replies in your brand voice, and summarizes long threads — all reviewable by your agents before anything is sent.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Purity is built with encryption in transit and at rest, role-based access controls, audit logging, and enterprise SSO. We're SOC 2 Type II compliant.",
  },
  {
    q: "What channels do you support?",
    a: "Email, live chat, web forms, social media, and WhatsApp all flow into one shared omnichannel inbox, with a complete conversation history for every customer.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Questions, answered
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10 w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`item-${i}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
