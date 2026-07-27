"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BoxesIcon,
  GaugeIcon,
  HeadsetIcon,
  InboxIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { AgentUserMenu } from "@/components/agent/AgentUserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAgentSession, useIntakeHealth } from "@/lib/agent-api/hooks";

interface NavItem {
  href: string;
  label: string;
  icon: typeof InboxIcon;
  /** When set, the item only renders for an agent holding one of these roles. */
  supervisorOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/agent/queue", label: "Queue", icon: InboxIcon },
  { href: "/agent/dashboard", label: "Dashboard", icon: GaugeIcon },
  { href: "/agent/batches", label: "Batches", icon: BoxesIcon },
  { href: "/agent/exceptions", label: "Intake exceptions", icon: TriangleAlertIcon, supervisorOnly: true },
];

export function AgentSidebar() {
  const pathname = usePathname();
  const { hasRole } = useAgentSession();
  const isSupervisor = hasRole("supervisor");

  // Only supervisors can open the exceptions list, so only they need the backlog count.
  const intakeHealth = useIntakeHealth();
  const unresolved = isSupervisor ? intakeHealth.data?.unresolved ?? 0 : 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/agent/queue">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HeadsetIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Purity Support</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    Agent Console
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) => !item.supervisorOnly || isSupervisor).map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? "border-l-2 border-primary pl-[6px] text-sidebar-accent-foreground"
                          : undefined
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className={isActive ? "text-primary" : undefined} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.href === "/agent/exceptions" && unresolved > 0 && (
                      <SidebarMenuBadge className="text-destructive">
                        {unresolved}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <AgentUserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
