"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { schoolSettings } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validation Schema
const settingsSchema = z.object({
  schoolName: z.string().min(1, "School Name is required"),
  schoolAddress: z.string().min(1, "Address is required"),
  schoolPhone: z.string().optional(),
  schoolEmail: z.string().email().optional().or(z.literal("")),
  currentSession: z.string().min(1, "Session is required"),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export async function updateSettingsAction(data: SettingsInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    const validated = settingsSchema.parse(data);

    // Check if a row exists (ID: 1)
    const existing = await db.query.schoolSettings.findFirst({
        where: eq(schoolSettings.id, 1)
    });

    if (existing) {
        await db.update(schoolSettings)
            .set({ ...validated, updatedAt: new Date() })
            .where(eq(schoolSettings.id, 1));
    } else {
        await db.insert(schoolSettings).values({
            id: 1, // Force ID 1 for singleton pattern
            ...validated
        });
    }

    revalidatePath("/admin/settings");
    return { success: true, message: "Settings updated successfully" };
  } catch (error) {
    console.error("Settings Update Error:", error);
    return { success: false, error: "Failed to update settings" };
  }
}