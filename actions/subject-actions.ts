"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subjects } from "@/src/db/schema";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createSubjectAction(data: { name: string; code: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    // Optional: Check if subject already exists to prevent duplicates
    const existing = await db.query.subjects.findFirst({
        where: eq(subjects.name, data.name)
    });

    if (existing) {
        return { success: false, error: "Subject already exists" };
    }

    await db.insert(subjects).values({
      name: data.name,
      code: data.code,
    });

    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    console.error("Create Subject Error:", error);
    return { success: false, error: "Failed to create subject" };
  }
}

export async function deleteSubjectAction(id: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await db.delete(subjects).where(eq(subjects.id, id));
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete subject" };
  }
}