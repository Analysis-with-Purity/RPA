import {
  TicketIcon,
  BotIcon,
  MessagesSquareIcon,
  BookOpenIcon,
  ZapIcon,
  BarChart3Icon,
  TimerIcon,
  InboxIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  primary?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: BotIcon,
    title: "AI Support Assistant",
    description:
      "Auto-triage, suggested replies, and instant ticket summaries so agents start every conversation ahead.",
    primary: true,
  },
  {
    icon: TicketIcon,
    title: "Ticket Management",
    description:
      "A blazing-fast queue with views, filters, tags, and SLAs â€” organized exactly how your team works.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Live Chat",
    description:
      "Real-time messaging with typing indicators, read receipts, and file sharing built right in.",
  },
  {
    icon: BookOpenIcon,
    title: "Knowledge Base",
    description:
      "A self-serve help center with AI-powered search that deflects tickets before they're created.",
  },
  {
    icon: ZapIcon,
    title: "Automation Engine",
    description:
      "Route, assign, and escalate with no-code rules and macros that handle the busywork for you.",
  },
  {
    icon: BarChart3Icon,
    title: "Analytics",
    description:
      "Executive dashboards for response times, CSAT, and agent performance â€” updated in real time.",
  },
  {
    icon: TimerIcon,
    title: "SLA Management",
    description:
      "Define policies, track targets, and get ahead of breaches before they ever reach a customer.",
  },
  {
    icon: InboxIcon,
    title: "Omnichannel Inbox",
    description:
      "Email, chat, social, and WhatsApp unified into one shared inbox with full conversation history.",
  },
  {
    icon: UsersIcon,
    title: "Team Collaboration",
    description:
      "Internal notes, @mentions, and shared assignments keep everyone aligned on every ticket.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Everything you need</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            One platform for the entire customer journey
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            From the first message to the final resolution â€” every tool your team needs, working
            together in one place.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div
                className={`flex size-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${
                  feature.primary
                    ? "bg-primary-muted text-primary"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
