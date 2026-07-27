import type { Agent } from "@/lib/types";

export const AGENTS: Agent[] = [
  { id: "agent-mira", name: "Mira Osei", email: "mira.osei@purity.support", title: "Senior Support Engineer" },
  { id: "agent-daniel", name: "Daniel Cho", email: "daniel.cho@purity.support", title: "Support Engineer" },
  { id: "agent-lena", name: "Lena Vasquez", email: "lena.vasquez@purity.support", title: "Billing Specialist" },
  { id: "agent-tobi", name: "Tobi Adewale", email: "tobi.adewale@purity.support", title: "Support Engineer" },
  { id: "agent-priya", name: "Priya Nair", email: "priya.nair@purity.support", title: "Technical Lead" },
];

export function getAgentById(id?: string): Agent | undefined {
  if (!id) return undefined;
  return AGENTS.find((a) => a.id === id);
}
