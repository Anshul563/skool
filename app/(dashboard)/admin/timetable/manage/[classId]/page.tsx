import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db"; // Check this path!
import { classes, subjects, teachers, lessons } from "@/src/db/schema"; // Check this path!
import { eq, asc } from "drizzle-orm";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import the Modal
import { CreateTimetableModal } from "@/components/create-timetable-modal";

// ⚠️ FIXED: Params must be defined as a Promise in Next.js 15+
export default async function ManageClassTimetablePage({ 
  params 
}: { 
  params: Promise<{ classId: string }> 
}) {
  // 1. Await params before using them
  const { classId } = await params;
  
  // 2. Validate ID is a number
  const classIdNum = Number(classId);
  if (isNaN(classIdNum)) {
    return notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/sign-in");

  // 3. Fetch Class Details (Using SAFE 'select' instead of 'query')
  // This prevents the "Failed query" error shown in your screenshot
  const [classData] = await db
    .select({
      id: classes.id,
      grade: classes.grade,
      section: classes.section,
      supervisorName: teachers.name,
    })
    .from(classes)
    .leftJoin(teachers, eq(classes.classTeacherId, teachers.id))
    .where(eq(classes.id, classIdNum));

  if (!classData) return notFound();

  // 4. Fetch Lessons for this class
  const classLessons = await db
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
    .where(eq(lessons.classId, classIdNum))
    .orderBy(asc(lessons.startTime));

  // 5. Fetch Data needed for the "Add Period" Modal
  const [subjectsData, teachersData] = await Promise.all([
    db.select({ id: subjects.id, name: subjects.name, code: subjects.code }).from(subjects),
    db.select({ id: teachers.id, name: teachers.name }).from(teachers),
  ]);

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="p-8 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/timetable">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Class {classData.grade}-{classData.section}</h1>
            <p className="text-muted-foreground">
                Manage schedule • Supervisor: {classData.supervisorName || "None"}
            </p>
        </div>
        
        {/* Modal for adding periods */}
        <CreateTimetableModal 
            classes={[{ id: classData.id, grade: classData.grade, section: classData.section }]} 
            subjects={subjectsData} 
            teachers={teachersData} 
        />
      </div>

      {/* Weekly Schedule View */}
      <Card className="min-h-[500px]">
        <Tabs defaultValue="Monday" className="w-full">
            <div className="border-b px-6 py-3 bg-gray-50/50 rounded-t-lg">
                <TabsList className="bg-transparent h-auto p-0 gap-4">
                    {weekDays.map(day => (
                        <TabsTrigger 
                            key={day} 
                            value={day}
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200 rounded-md px-4 py-2"
                        >
                            {day}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            {weekDays.map(day => {
                const dailyLessons = classLessons.filter(l => l.day === day.toUpperCase());
                
                return (
                    <TabsContent key={day} value={day} className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-lg">{day} Schedule</h3>
                        </div>

                        {dailyLessons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl text-gray-400">
                                <p>No periods scheduled for {day}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dailyLessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center p-4 border rounded-xl hover:bg-slate-50 transition bg-white shadow-sm group">
                                        
                                        {/* Time */}
                                        <div className="w-32 shrink-0">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md w-fit">
                                                <Clock size={14} />
                                                {/* Slice to handle "08:00:00" -> "08:00" */}
                                                {lesson.startTime ? lesson.startTime.slice(0, 5) : "--:--"}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1 pl-1">
                                                to {lesson.endTime ? lesson.endTime.slice(0, 5) : "--:--"}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 px-4 border-l ml-4">
                                            <h4 className="font-bold text-gray-900">{lesson.subject || "Unknown Subject"}</h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                by {lesson.teacher || "Unassigned"}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            <Badge variant="outline" className="text-xs">Active</Badge>
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