import { CATEGORIES } from "@/lib/mock-data/categories";
import { DEPARTMENTS } from "@/lib/mock-data/departments";
import { AGENTS } from "@/lib/mock-data/agents";
import { simulateNetwork } from "./client";

export async function getCategories() {
  return simulateNetwork(CATEGORIES, { delayMs: 150 });
}

export async function getDepartments() {
  return simulateNetwork(DEPARTMENTS, { delayMs: 150 });
}

export async function getAgents() {
  return simulateNetwork(AGENTS, { delayMs: 150 });
}
