import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { classes, teachers } from "@/src/db/schema"; // Import teachers table
import { eq } from "drizzle-orm";
import { School, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function TeacherClassesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "teacher") return redirect("/sign-in");

  // 1. Fetch Teacher Profile to get their Database ID
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  if (!teacherProfile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Profile Not Found</h2>
        <p className="text-gray-500">Please contact the admin to complete your teacher profile registration.</p>
      </div>
    );
  }

  // 2. Fetch ONLY classes assigned to this teacher
  const assignedClasses = await db
    .select()
    .from(classes)
    .where(eq(classes.classTeacherId, teacherProfile.id));

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Assigned Classes</h1>
        <p className="text-muted-foreground">
          Welcome, {teacherProfile.name}. Here are the classes you are managing.
        </p>
      </div>

      {assignedClasses.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500">
            <BookOpen className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">No Classes Assigned</h3>
            <p className="text-sm">You haven&apos;t been assigned as a class teacher yet.</p>
        </div>
      ) : (
        // Classes Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedClasses.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-all ">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <School className="h-5 w-5 text-blue-600" />
                  Class {cls.grade}-{cls.section}
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {cls.capacity} Seats
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">A</div>
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">B</div>
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">+</div>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Students Enrolled</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" asChild>
                      <Link href={`/teacher/attendance`}>
                          Take Attendance
                      </Link>
                  </Button>
                  <Button className="w-full" asChild>
                      {/* You can create a detailed view for specific class later */}
                      <Link href={`/teacher/classes/${cls.id}`}>
                          View Details <ArrowRight className="ml-2 h-3 w-3" />
                      </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}