"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button asChild size="sm" variant="default" className="hidden sm:inline-flex">
          <Link href="/tickets/new">
            <PlusIcon /> New ticket
          </Link>
        </Button>
        <Button asChild size="icon" variant="default" className="sm:hidden">
          <Link href="/tickets/new">
            <PlusIcon />
            <span className="sr-only">New ticket</span>
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
