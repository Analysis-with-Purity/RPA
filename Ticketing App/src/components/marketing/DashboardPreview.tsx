import {
  LayoutDashboardIcon,
  TicketIcon,
  InboxIcon,
  BarChart3Icon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboardIcon, label: "Dashboard", active: true },
  { icon: InboxIcon, label: "Inbox" },
  { icon: TicketIcon, label: "Tickets" },
  { icon: BarChart3Icon, label: "Analytics" },
  { icon: SettingsIcon, label: "Settings" },
];

const STAT_TILES = [
  { label: "Open", value: "128", accent: "text-primary" },
  { label: "Resolved", value: "1,204", accent: "text-[color:var(--success)]" },
  { label: "CSAT", value: "98%", accent: "text-primary" },
];

const ROWS = [
  { id: "TCK-4821", subject: "Payment webhook retries failing", tone: "urgent" },
  { id: "TCK-4820", subject: "SSO redirect loop on login", tone: "high" },
  { id: "TCK-4818", subject: "Export CSV missing columns", tone: "medium" },
];

const TONE_STYLES: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
};

// A stylized, non-interactive product screenshot built from real UI atoms.
export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <span className="size-3 rounded-full bg-destructive/70" />
        <span className="size-3 rounded-full bg-warning/70" />
        <span className="size-3 rounded-full bg-success/70" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md border bg-background px-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            app.puritysupport.com/dashboard
          </span>
        </div>
      </div>

      <div className="flex">
        {/* Mini sidebar */}
        <div className="hidden w-40 shrink-0 flex-col gap-1 border-r bg-sidebar/50 p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
              P
            </div>
            <span className="text-xs font-semibold">Purity</span>
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                item.active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-3.5" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-3">
            {STAT_TILES.map((tile) => (
              <div key={tile.label} className="rounded-lg border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">{tile.label}</p>
                <p className={`mt-1 text-lg font-semibold ${tile.accent}`}>{tile.value}</p>
              </div>
            ))}
          </div>

          {/* Faux area chart */}
          <div className="rounded-lg border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium">Ticket volume</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                <SparklesIcon className="size-3" /> AI triage on
              </span>
            </div>
            <svg viewBox="0 0 320 90" className="h-24 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 70 C 30 60, 45 40, 70 45 S 115 30, 140 38 S 185 12, 210 22 S 260 55, 285 40 L 320 30"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0 70 C 30 60, 45 40, 70 45 S 115 30, 140 38 S 185 12, 210 22 S 260 55, 285 40 L 320 30 L 320 90 L 0 90 Z"
                fill="url(#previewFill)"
              />
            </svg>
          </div>

          {/* Ticket rows */}
          <div className="space-y-2">
            {ROWS.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5"
              >
                <span className={`size-2 shrink-0 rounded-full ${TONE_STYLES[row.tone]}`} />
                <span className="font-mono text-[11px] text-muted-foreground">{row.id}</span>
                <span className="min-w-0 flex-1 truncate text-xs">{row.subject}</span>
                <span className="hidden rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                  In progress
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
