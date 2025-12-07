"use server";

import { db } from "@/lib/db";
import { attendance } from "@/src/db/schema";
import { revalidatePath } from "next/cache";

export async function saveAttendanceAction(data: {
  classId: number;
  date: Date;
  records: { studentId: number; isPresent: boolean }[];
}) {
  try {
    // Format date as YYYY-MM-DD string for consistency
    const formattedDate = data.date.toISOString().split("T")[0];

    // Loop through records and insert
    // Note: In a real app, you might want to check if attendance already exists for this date and update it instead
    await Promise.all(
      data.records.map(async (record) => {
        await db.insert(attendance).values({
          studentId: record.studentId,
          classId: data.classId,
          date: formattedDate,
          isPresent: record.isPresent,
        });
      })
    );

    revalidatePath("/teacher/attendance");
    return { success: true };
  } catch (error) {
    console.error("Attendance Error:", error);
    return { success: false, error: "Failed to save attendance" };
  }
}