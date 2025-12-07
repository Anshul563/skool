import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db"; // Adjust path if needed
import {
  students,
  classes,
  lessons,
  subjects,
  teachers,
} from "@/src/db/schema"; // Adjust path if needed
import { eq, and, asc } from "drizzle-orm";
import { CalendarDays, Clock, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function StudentTimetablePage() {
  // 1. Auth Check
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "student") {
    return redirect("/sign-in");
  }

  // 2. Get Student Profile & Find Matching Class
  // Since there is no classId FK, we join on grade AND section columns.
  const [studentData] = await db
    .select({
      studentName: students.name,
      grade: students.grade,
      section: students.section,
      classId: classes.id, // Get the ID from the matched class table
    })
    .from(students)
    .leftJoin(
      classes,
      and(
        eq(students.grade, classes.grade),
        eq(students.section, classes.section)
      )
    )
    .where(eq(students.userId, session.user.id));

  // Handle case where student has no data or no matching class found
  if (!studentData || !studentData.classId) {
    return (
      <div className="p-8 space-y-4">
        <h1 className="text-2xl font-bold">My Timetable</h1>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6 text-yellow-800">
            <p className="font-semibold">No Class Assignment Found</p>
            <p className="mt-2 text-sm">
              You are registered as{" "}
              <strong>
                {studentData?.grade || "N/A"}-{studentData?.section || "N/A"}
              </strong>
              , but we couldn&apos;t find a matching timetable. Please contact
              your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Fetch Timetable (Lessons) using the found classId
  const classSchedule = await db
    .select({
      id: lessons.id,
      day: lessons.day,
      startTime: lessons.startTime,
      endTime: lessons.endTime,
      subject: subjects.name,
      teacher: teachers.name,
    })
    .from(lessons)
    .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
    .leftJoin(teachers, eq(lessons.teacherId, teachers.id))
    .where(eq(lessons.classId, studentData.classId))
    .orderBy(asc(lessons.startTime));

  // Helper to match DB Enum days with UI tabs
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
        <p className="text-muted-foreground">
          Class Schedule for Grade {studentData.grade}-{studentData.section}
        </p>
      </div>

      <Card className="p-1">
        <Tabs defaultValue="Monday" className="w-full">
          {/* Tabs Navigation */}
          <div className="border-b px-4 py-2 rounded-t-lg overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 flex justify-start gap-2">
              {weekDays.map((day) => (
                <TabsTrigger
                  key={day}
                  value={day}
                  className="px-4 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200 rounded-md transition-all"
                >
                  {day}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tabs Content (Per Day) */}
          {weekDays.map((day) => {
            // Filter lessons for this specific day
            // Normalize case: DB is 'MONDAY', UI is 'Monday'
            const dailyLessons = classSchedule.filter(
              (l) => l.day === day.toUpperCase()
            );

            return (
              <TabsContent
                key={day}
                value={day}
                className="p-6 space-y-4 min-h-[400px]"
              >
                <div className="flex items-center gap-2 mb-6">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-lg ">
                    {day}&apos;s Classes
                  </h3>
                </div>

                {dailyLessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed rounded-xl">
                    <p>No classes scheduled for {day}.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dailyLessons.map((period) => (
                      <div
                        key={period.id}
                        className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border rounded-xl  transition  shadow-sm"
                      >
                        {/* Time Slot */}
                        <div className="min-w-40 shrink-0">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-700  px-3 py-2 rounded-md border  w-fit">
                            <Clock className="h-4 w-4" />
                            {/* Slice seconds: 09:00:00 -> 09:00 */}
                            {period.startTime?.slice(0, 5)} -{" "}
                            {period.endTime?.slice(0, 5)}
                          </div>
                        </div>

                        {/* Subject & Teacher Info */}
                        <div className="flex-1 space-y-1">
                          <h4 className="font-bold text-lg  leading-none">
                            {period.subject || "Unknown Subject"}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            Instructor: {period.teacher || "TBA"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
}
