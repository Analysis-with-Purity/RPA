import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/container";
import { InstagramIcon, FacebookIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons/social";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact Us — Purity",
  description:
    "Get in touch with Purity Luxury Fragrance House — WhatsApp, email, phone, socials and our Victoria Island showroom.",
};

const CONTACT_METHODS = [
  {
    label: "WhatsApp",
    value: "+234 800 000 0000",
    href: "https://wa.me/2348000000000",
    icon: WhatsAppIcon,
  },
  {
    label: "Email",
    value: "hello@purity-parfums.com",
    href: "mailto:hello@purity-parfums.com",
    icon: Mail,
  },
  {
    label: "Phone",
    value: "+234 800 000 0000",
    href: "tel:+2348000000000",
    icon: Phone,
  },
  {
    label: "Showroom",
    value: "12 Kofo Abayomi Street, Victoria Island, Lagos",
    href: "https://maps.google.com/?q=Kofo+Abayomi+Street+Victoria+Island+Lagos",
    icon: MapPin,
  },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon, handle: "@purity.parfums" },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon, handle: "Purity Parfums" },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon, handle: "@purity.parfums" },
  { label: "WhatsApp", href: "https://wa.me/2348000000000", Icon: WhatsAppIcon, handle: "+234 800 000 0000" },
];

export default function ContactPage() {
  return (
    <div className="bg-ivory">
      <section className="py-24 md:py-28">
        <Container className="flex flex-col items-center text-center">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold animate-fade-up">
            We&apos;d Love To Hear From You
          </span>
          <h1 className="mt-5 font-serif text-4xl md:text-5xl text-ink animate-fade-up">
            Get In Touch
          </h1>
          <p className="mt-5 max-w-xl text-sm md:text-base text-ink/60 leading-relaxed animate-fade-up">
            Whether it&apos;s fragrance advice, an order enquiry, or a partnership request — our
            concierge team is here for you across every channel.
          </p>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_METHODS.map(({ label, value, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group bg-white border border-line p-8 flex flex-col items-center text-center gap-4 hover:border-royal transition-colors"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-royal-light text-royal group-hover:bg-royal group-hover:text-white transition-colors">
                  <Icon size={20} strokeWidth={1.4} />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">{label}</p>
                  <p className="mt-1 text-sm text-ink">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container className="grid lg:grid-cols-5 gap-14">
          <div className="lg:col-span-3">
            <SectionHeading
              align="left"
              eyebrow="Send A Message"
              title="Fill Out The Form Below"
              subtitle="Share the details and a member of our concierge team will respond within 24 hours."
            />
            <div className="mt-10">
              <ContactForm />
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-10">
            <div>
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Follow Us</span>
              <h3 className="mt-3 font-serif text-2xl text-ink">Join The Purity Circle</h3>
              <div className="mt-6 flex flex-col gap-4">
                {SOCIALS.map(({ label, href, Icon, handle }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 text-ink/70 hover:text-royal transition-colors"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line">
                      <Icon width={16} height={16} />
                    </span>
                    <span className="text-sm">
                      <span className="block text-[11px] uppercase tracking-[0.14em] text-ink/40">{label}</span>
                      {handle}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="border-t border-line pt-8">
              <span className="text-[11px] uppercase tracking-[0.3em] text-gold">Business Hours</span>
              <div className="mt-4 flex items-start gap-3 text-sm text-ink/70">
                <Clock size={16} strokeWidth={1.4} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p>Monday – Friday: 9:00 AM – 6:00 PM</p>
                  <p>Saturday: 10:00 AM – 4:00 PM</p>
                  <p>Sunday: Closed (WhatsApp orders still attended to)</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container>
          <SectionHeading
            eyebrow="Visit Our Showroom"
            title="Find Us In Victoria Island"
            subtitle="12 Kofo Abayomi Street, Victoria Island, Lagos, Nigeria."
          />
          <div className="mt-10 border border-line overflow-hidden aspect-[16/9] md:aspect-[21/9]">
            <iframe
              title="Purity Showroom Location — Victoria Island, Lagos"
              src="https://maps.google.com/maps?q=Victoria%20Island%2C%20Lagos%2C%20Nigeria&t=&z=14&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Container>
      </section>
    </div>
  );
}
