import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Container } from "@/components/ui/container";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { EmailVerifyBanner } from "@/components/dashboard/email-verify-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="bg-ivory min-h-[calc(100vh-8rem)]">
      <Container className="py-12">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-2">My Account</p>
        <h1 className="font-serif text-3xl mb-8">
          Welcome, {session.user.name?.split(" ")[0]}
        </h1>

        {!session.user.emailVerified && <EmailVerifyBanner email={session.user.email ?? ""} />}

        <div className="grid md:grid-cols-[220px_1fr] gap-10 mt-6">
          <DashboardNav />
          <div>{children}</div>
        </div>
      </Container>
    </div>
  );
}
