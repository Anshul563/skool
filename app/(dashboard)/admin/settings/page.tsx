import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { schoolSettings } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/sign-in");

  // Fetch existing settings (ID 1)
  const settings = await db.query.schoolSettings.findFirst({
    where: eq(schoolSettings.id, 1)
  });

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage school profile and global configurations.
        </p>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}