import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { classes, students, teachers } from "@/src/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  ArrowLeft,
  Users,
  School,
  Phone,
  Mail,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function TeacherClassDetailsPage({ params }: PageProps) {
  // Handle async params for Next.js 15 compatibility
  const { id } = await params;
  const classId = parseInt(id);

  if (isNaN(classId)) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "teacher") return redirect("/sign-in");

  // 1. Fetch Teacher Profile to get ID
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  if (!teacherProfile) return redirect("/teacher"); // Handle edge case

  // 2. Fetch Class Details & Verify Assignment
  // We check if this class exists AND if it is assigned to the current teacher
  const classData = await db.query.classes.findFirst({
    where: and(
      eq(classes.id, classId),
      eq(classes.classTeacherId, teacherProfile.id)
    ),
  });

  // Security Block: If not assigned, show unauthorized
  if (!classData) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-500">
          You are not the assigned teacher for this class.
        </p>
        <Button asChild variant="outline">
          <Link href="/teacher/classes">Return to My Classes</Link>
        </Button>
      </div>
    );
  }

  // 3. Fetch Students in this Class
  // Matching by Grade and Section strings
  const studentsList = await db.query.students.findMany({
    where: and(
      eq(students.grade, classData.grade),
      eq(students.section, classData.section)
    ),
    orderBy: [asc(students.rollNumber)], // Sort by Roll No
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/teacher/classes"
          className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Classes
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex bg-card flex-col md:flex-row justify-between items-start md:items-center gap-4  p-6 border rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16  rounded-full flex items-center justify-center border border-white shadow-sm">
            <School className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold ">
              Class {classData.grade}-{classData.section}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> {studentsList.length} Students
              Enrolled
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/teacher/attendance">Take Attendance</Link>
          </Button>
          <Button variant="outline">Export Data</Button>
        </div>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Manage student profiles and academic records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="">
                <TableHead className="w-[100px]">Roll No</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Guardian Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-gray-500"
                  >
                    No students found in this class.
                  </TableCell>
                </TableRow>
              ) : (
                studentsList.map((student) => (
                  <TableRow
                    key={student.id}
                    className="transition"
                  >
                    <TableCell className="font-mono font-medium">
                      <Badge variant="outline" className="">
                        {student.rollNumber
                          ? student.rollNumber.slice(-2)
                          : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={student.profileImage || ""} />
                          <AvatarFallback className="bg-blue-50 text-blue-700">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-gray-500">
                            {student.admissionNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium">
                          {student.fatherName || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {student.motherName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        {student.mobile && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" /> {student.mobile}
                          </div>
                        )}
                        {/* Since email is in Auth table and not joined here, we skip it or fetch it if needed */}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuItem className="text-gray-400">View Profile</DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-400">Academic Report</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Report Issue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
