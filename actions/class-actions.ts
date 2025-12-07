"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { classes } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function assignTeacherAction(data: { classId: number, teacherId: number }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    await db.update(classes)
      .set({ classTeacherId: data.teacherId })
      .where(eq(classes.id, data.classId));

    return { success: true };
  } catch (error) {
    console.error("Assign Teacher Error:", error);
    return { success: false, error: "Failed to assign teacher" };
  }
}

export async function createClassAction(data: {
  grade: string;
  sections: { sectionName: string; capacity: number }[];
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    // Loop through the sections and insert each one
    // We use Promise.all to run them in parallel for speed
    await Promise.all(
      data.sections.map(async (sec) => {
        await db.insert(classes).values({
          grade: data.grade,
          section: sec.sectionName,
          capacity: sec.capacity,
        });
      })
    );

    return { success: true };
  } catch (error) {
    console.error("Create Class Error:", error);
    return { success: false, error: "Failed to create classes" };
  }
}