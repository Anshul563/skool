import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { classes, students } from "@/src/db/schema";
import { sql } from "drizzle-orm";
import { CreateStudentForm } from "@/components/create-student-form";

export default async function AddStudentPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return redirect("/sign-in");

  // Fetch classes for the dropdown (Ordered by Grade 1 -> 12)
  // We use parseInt in sorting if needed, but simple asc works for '1', '10' strings if careful. 
  // Ideally store grade as integer, but for now string sort:
  const availableClasses = await db
    .select({
      id: classes.id,
      grade: classes.grade,
      section: classes.section,
      capacity: classes.capacity,
      // Count students in this class
      studentCount: sql<number>`(
        SELECT count(*) FROM ${students} WHERE ${students.id} = ${classes.id}
      )`.mapWith(Number),
    })
    .from(classes)
    .orderBy(classes.grade, classes.section);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admit New Student</h1>
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <CreateStudentForm availableClasses={availableClasses} />
      </div>
    </div>
  );
}