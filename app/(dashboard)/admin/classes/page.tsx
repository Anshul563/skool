import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { classes, teachers } from "@/src/db/schema";
import { asc, eq } from "drizzle-orm";
import { CreateClassForm } from "@/components/create-class-form";
import { AssignTeacherDialog } from "@/components/assign-teacher-dialog"; // Import the new component
import { Users, School } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ClassesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return redirect("/sign-in");

  // 1. Fetch Classes with Assigned Teacher Name (Left Join)
  const classesData = await db
    .select({
        id: classes.id,
        grade: classes.grade,
        section: classes.section,
        capacity: classes.capacity,
        classTeacherId: classes.classTeacherId,
        teacherName: teachers.name // Get teacher name
    })
    .from(classes)
    .leftJoin(teachers, eq(classes.classTeacherId, teachers.id))
    .orderBy(asc(classes.grade), asc(classes.section));

  // 2. Fetch All Teachers (for the dropdown list)
  const teachersList = await db.select({ id: teachers.id, name: teachers.name }).from(teachers);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Class Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Create Form */}
        <div className="lg:col-span-1">
            <CreateClassForm />
        </div>

        {/* RIGHT COLUMN: List of Classes */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" /> Active Classes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class Name</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Class Teacher</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classesData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                                        No classes found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classesData.map((cls) => (
                                    <TableRow key={cls.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {cls.grade}-{cls.section}
                                                </div>
                                                Standard {cls.grade}
                                            </div>
                                        </TableCell>
                                        <TableCell>{cls.capacity} Seats</TableCell>
                                        <TableCell>
                                            {cls.teacherName ? (
                                                <span className="text-blue-600 font-medium">{cls.teacherName}</span>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Not Assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {/* Dialog Component */}
                                            <AssignTeacherDialog 
                                                classId={cls.id} 
                                                className={`${cls.grade}-${cls.section}`}
                                                currentTeacherId={cls.classTeacherId}
                                                teachersList={teachersList}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}