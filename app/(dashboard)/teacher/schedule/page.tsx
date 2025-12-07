import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db"; // Adjust path if needed
import { lessons, classes, subjects, teachers } from "@/src/db/schema"; // Adjust path if needed
import { eq, and, asc } from "drizzle-orm";

export default async function TeacherSchedulePage() {
  // 1. Security Check
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== "teacher") {
    return redirect("/sign-in");
  }

  // 2. Get the Teacher Profile ID linked to the User
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
    columns: { id: true }
  });

  if (!teacherProfile) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: Teacher profile not found for this user account.
      </div>
    );
  }

  // 3. Fetch Schedule (Lessons) for this Teacher
  // Joining Lessons -> Classes & Subjects
  const teacherSchedule = await db
    .select({
      id: lessons.id,
      day: lessons.day,
      startTime: lessons.startTime,
      endTime: lessons.endTime,
      subjectName: subjects.name,
      className: classes.grade,
      classSection: classes.section,
    })
    .from(lessons)
    .innerJoin(classes, eq(lessons.classId, classes.id))
    .innerJoin(subjects, eq(lessons.subjectId, subjects.id))
    .where(eq(lessons.teacherId, teacherProfile.id))
    .orderBy(asc(lessons.startTime));

  // Helper to match DB Enum days (MONDAY) with UI tabs (Monday)
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Teaching Schedule</h1>
        <p className="text-muted-foreground">
          Your weekly timetable and classroom assignments.
        </p>
      </div>

      <Card className="p-1">
        <Tabs defaultValue="Monday" className="w-full">
          {/* Tabs Navigation */}
          <div className="border-b px-4 py-2  rounded-t-lg overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 flex justify-start gap-2">
              {weekDays.map((day) => (
                <TabsTrigger
                  key={day}
                  value={day}
                  className="px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200 rounded-md transition-all"
                >
                  {day}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tabs Content (Per Day) */}
          {weekDays.map((day) => {
            // Filter lessons for this specific day
            // Note: DB stores 'MONDAY', UI uses 'Monday'. We normalize to compare.
            const dailyLessons = teacherSchedule.filter(
              (l) => l.day === day.toUpperCase()
            );

            return (
              <TabsContent
                key={day}
                value={day}
                className="p-6 space-y-4 min-h-[400px]"
              >
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-500" /> 
                  {day}&apos;s Classes ({dailyLessons.length})
                </h3>

                {dailyLessons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed rounded-xl">
                    <p>No classes scheduled for {day}.</p>
                  </div>
                ) : (
                  dailyLessons.map((period) => (
                    <div
                      key={period.id}
                      className="flex flex-col md:flex-row gap-4 items-start md:items-center p-4 border rounded-xl  transition  shadow-sm"
                    >
                      {/* Time Slot */}
                      <div className="min-w-[160px] flex items-center gap-2 text-sm font-medium text-blue-700  px-3 py-2 rounded-md border border-blue-100">
                        <Clock className="h-4 w-4" /> 
                        {/* Slice removes seconds from '09:00:00' -> '09:00' */}
                        {period.startTime.slice(0, 5)} - {period.endTime.slice(0, 5)}
                      </div>

                      {/* Class Info */}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg ">{period.subjectName}</h4>
                        <div className="flex gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded dark:text-gray-200 font-medium">
                            <BookOpen className="h-3.5 w-3.5" /> 
                            Class {period.className}-{period.classSection}
                          </span>
                        </div>
                      </div>

                      {/* Status Indicator (Optional Visual) */}
                      <div className="hidden md:block">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-green-100 text-green-700">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </div>
  );
}