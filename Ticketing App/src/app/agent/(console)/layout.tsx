import { AgentSidebar } from "@/components/agent/AgentSidebar";
import { AgentTopbar } from "@/components/agent/AgentTopbar";
import { RequireAgentSession } from "@/components/agent/RequireAgentSession";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Chrome for the signed-in console. Sign-in sits outside this group so it renders bare.
 */
export default function AgentConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAgentSession>
      <SidebarProvider>
        <AgentSidebar />
        <SidebarInset>
          <AgentTopbar />
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </RequireAgentSession>
  );
}
