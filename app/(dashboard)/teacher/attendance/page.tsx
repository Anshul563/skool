import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { classes, teachers } from "@/src/db/schema"; // Import teachers table
import { eq } from "drizzle-orm";
import { AttendanceClient } from "@/components/attendance-client";
import { BookOpen } from "lucide-react";

export default async function AttendancePage() {
  // 1. Verify Teacher Session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "teacher") return redirect("/sign-in");

  // 2. Get Teacher Profile (to find their Database ID)
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  if (!teacherProfile) {
    return (
        <div className="p-8 text-center text-red-500">
            Teacher profile not found. Please contact admin.
        </div>
    );
  }

  // 3. Fetch ONLY Assigned Classes
  // We filter classes where classTeacherId matches this teacher
  const assignedClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.classTeacherId, teacherProfile.id));

  // 4. Handle "No Classes" Scenario gracefully
  if (assignedClasses.length === 0) {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Mark Attendance</h1>
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
                <BookOpen className="h-10 w-10 mb-3 text-gray-300" />
                <p>You have not been assigned to any classes yet.</p>
                <p className="text-sm">Contact the principal to get classes assigned.</p>
            </div>
        </div>
    );
  }

  // 5. Render Client Component with Filtered Data
  return (
    <div className="p-8 max-w-4xl mx-auto">
       <AttendanceClient availableClasses={assignedClasses} />
    </div>
  );
}