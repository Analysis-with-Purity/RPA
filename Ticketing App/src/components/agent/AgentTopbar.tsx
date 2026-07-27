"use client";

import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AgentSearchCommand } from "@/components/agent/AgentSearchCommand";

const TITLES: Array<[prefix: string, title: string]> = [
  ["/agent/queue", "Queue"],
  ["/agent/tickets", "Ticket"],
  ["/agent/dashboard", "Dashboard"],
  ["/agent/batches", "Batch report"],
  ["/agent/exceptions", "Intake exceptions"],
];

export function AgentTopbar() {
  const pathname = usePathname() ?? "";
  const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Console";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">{title}</span>
      <div className="flex flex-1 items-center justify-end gap-2">
        <AgentSearchCommand />
        <ThemeToggle />
      </div>
    </header>
  );
}
