import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db"; // Adjust path
import { classes, teachers, lessons } from "@/src/db/schema"; // Adjust path
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Users, Calendar, ArrowRight } from "lucide-react";

// Shadcn UI
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TimetableClassesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/sign-in");

  // Fetch Classes with Teacher Name and Lesson Count
  // We use a raw count query or grouping for lesson count, 
  // but for simplicity, let's fetch basic details and joins first.
  const classesList = await db
    .select({
      id: classes.id,
      grade: classes.grade,
      section: classes.section,
      capacity: classes.capacity,
      teacherName: teachers.name,
      // Subquery to count lessons for this class
      lessonCount: sql<number>`(SELECT count(*) FROM ${lessons} WHERE ${lessons.classId} = ${classes.id})`
    })
    .from(classes)
    .leftJoin(teachers, eq(classes.classTeacherId, teachers.id))
    .orderBy(classes.grade, classes.section);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
        <p className="text-muted-foreground mt-1">Select a class to view or modify its weekly schedule.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classesList.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Class {cls.grade}-{cls.section}</CardTitle>
                  <CardDescription className="mt-1">
                    {cls.teacherName ? `Form Tutor: ${cls.teacherName}` : "No Tutor Assigned"}
                  </CardDescription>
                </div>
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{Number(cls.lessonCount)} Periods Assigned</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                 <Badge variant={Number(cls.lessonCount) > 0 ? "default" : "secondary"}>
                    {Number(cls.lessonCount) > 0 ? "Active Schedule" : "No Schedule"}
                 </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link href={`/admin/timetable/manage/${cls.id}`} className="w-full">
                <Button className="w-full group">
                  Manage Timetable 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}