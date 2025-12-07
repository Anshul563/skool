"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcements } from "@/src/db/schema";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function createAnnouncementAction(data: any) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await db.insert(announcements).values({
      title: data.title,
      content: data.content,
      audience: data.audience,
      type: data.type,
      imageUrl: data.imageUrl || null,
    });

    // Optional: Send Push Notification or Email here

    return { success: true };
  } catch (error) {
    console.error("Create Announcement Error:", error);
    return { success: false, error: "Failed to create announcement" };
  }
}

export async function deleteAnnouncementAction(id: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await db.delete(announcements).where(eq(announcements.id, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}