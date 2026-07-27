"use client";

import { ChevronsUpDownIcon, LogOutIcon, ShieldCheckIcon, TimerIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAgentSession } from "@/lib/agent-api/session";

function initials(name: string) {
  return name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatExpiry(expiresAt: number): string {
  const minutes = Math.round((expiresAt - Date.now()) / 60_000);
  if (minutes <= 0) return "expired";
  if (minutes < 60) return `${minutes}m left`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`;
}

export function AgentUserMenu() {
  const { session, signOut } = useAgentSession();
  if (!session) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {initials(session.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{session.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {session.roles.join(" · ")}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            align="end"
            side="top"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="grid gap-1.5 text-left text-sm leading-tight">
                <span className="truncate font-medium">{session.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {session.subject}
                </span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {session.roles.map((role) => (
                    <Badge key={role} variant="info" className="text-[10px]">
                      <ShieldCheckIcon className="size-3" />
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <TimerIcon className="size-3.5" />
              Token {formatExpiry(session.expiresAt)}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem variant="destructive" onSelect={() => signOut()}>
              <LogOutIcon /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
