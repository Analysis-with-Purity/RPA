import { redirect } from "next/navigation";

/** The queue is the console's home — it is what an agent opens the app to look at. */
export default function AgentIndexPage() {
  redirect("/agent/queue");
}
