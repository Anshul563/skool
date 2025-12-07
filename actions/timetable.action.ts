"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { lessons } from "@/src/db/schema";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Validation Schema ---
// We define the shape of the data here to ensure safety before inserting
const timetableSchema = z.object({
  classId: z.coerce.number("Class ID is required" ),
  
  // Day Enum matches your DB schema
  day: z.enum([
    "MONDAY", 
    "TUESDAY", 
    "WEDNESDAY", 
    "THURSDAY", 
    "FRIDAY", 
    "SATURDAY", 
    "SUNDAY"
  ]).default("MONDAY"),

  periods: z.array(
    z.object({
      subjectId: z.coerce.number( "Subject is required" ),
      teacherId: z.coerce.number( "Teacher is required" ),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().min(1, "End time is required"),
    })
  ).min(1, "At least one period is required"),
});

// Infer type for the function argument
type InputType = z.infer<typeof timetableSchema>;

export async function createTimetable(data: InputType) {
  // 1. Security & Role Check
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 2. Validate Data Structure
    const result = timetableSchema.safeParse(data);

    if (!result.success) {
      return { 
        success: false, 
        error: result.error.issues[0].message || "Invalid data submitted" 
      };
    }

    const { classId, periods, day } = result.data;

    // 3. Prepare Data for Bulk Insert
    // Mapping the validated data to match the database table columns
    const lessonsToInsert = periods.map((period) => ({
      name: "Regular Class", 
      day: day, 
      // Ensure time string format fits PostgreSQL (HH:MM:SS)
      startTime: period.startTime.length === 5 ? `${period.startTime}:00` : period.startTime,
      endTime: period.endTime.length === 5 ? `${period.endTime}:00` : period.endTime,
      subjectId: period.subjectId,
      classId: classId,
      teacherId: period.teacherId, 
    }));

    // 4. Insert into Database
    if (lessonsToInsert.length > 0) {
      await db.insert(lessons).values(lessonsToInsert);
    }

    // 5. Revalidate
    revalidatePath("/admin/timetable");
    return { success: true, message: "Timetable created successfully" };

  } catch (error) {
    console.error("Create Timetable Error:", error);
    return { success: false, error: "Failed to create timetable" };
  }
}