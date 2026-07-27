import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";

export default async function ProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return null;

  return (
    <div className="space-y-10 max-w-lg">
      <section className="bg-white border border-line p-8">
        <h2 className="font-serif text-xl mb-1">Profile Information</h2>
        <p className="text-sm text-ink/50 mb-6">Update your personal details.</p>
        <ProfileForm defaultName={user.name} defaultPhone={user.phone ?? ""} email={user.email} />
      </section>

      <section className="bg-white border border-line p-8">
        <h2 className="font-serif text-xl mb-1">Change Password</h2>
        <p className="text-sm text-ink/50 mb-6">Keep your account secure with a strong password.</p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
