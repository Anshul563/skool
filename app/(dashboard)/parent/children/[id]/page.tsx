import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { students } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { 
  ArrowLeft, 
  Calendar, 
  School, 
  User, 
  BookOpen, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ChildDetailPage({ params }: PageProps) {
  // Await params if using Next.js 15, otherwise direct access works in 14
  const { id } = await params; 
  const studentId = parseInt(id);

  if (isNaN(studentId)) return notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "parent") return redirect("/sign-in");

  // 1. Fetch Student & Verify Parent Ownership
  // We use 'and' to ensure the parent can only see their OWN child
  const student = await db.query.students.findFirst({
    where: and(
        eq(students.id, studentId),
        eq(students.parentId, session.user.id)
    )
  });

  if (!student) {
    return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600">Unauthorized or Student Not Found</h2>
            <p className="text-gray-500">You do not have permission to view this profile.</p>
            <Button asChild className="mt-4" variant="outline">
                <Link href="/parent/children">Go Back</Link>
            </Button>
        </div>
    );
  }

  // Placeholder data for sections not yet in DB (Attendance/Results)
  const attendancePercentage = 92;
  const recentGrades = [
    { subject: "Mathematics", grade: "A", score: 92 },
    { subject: "Science", grade: "B+", score: 88 },
    { subject: "English", grade: "A-", score: 90 },
    { subject: "History", grade: "B", score: 85 },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Link href="/parent/children" className="text-gray-500 hover:text-gray-900 transition flex items-center gap-1 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Children
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <Avatar className="h-24 w-24 border-4 border-orange-50">
            <AvatarImage src={student.profileImage || ""} />
            <AvatarFallback className="text-3xl bg-orange-100 text-orange-700">
                {student.name.charAt(0)}
            </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-3xl font-bold">{student.name}</h1>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                    Active Student
                </Badge>
            </div>
            <div className="text-muted-foreground flex flex-col md:flex-row gap-4 text-sm justify-center md:justify-start">
                <span className="flex items-center gap-1">
                    <School className="h-4 w-4" /> Class {student.grade}-{student.section}
                </span>
                <span className="flex items-center gap-1">
                    <User className="h-4 w-4" /> Roll No: {student.rollNumber ? student.rollNumber.slice(-2) : "N/A"}
                </span>
                <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> DOB: {student.dob ? new Date(student.dob).toLocaleDateString() : "N/A"}
                </span>
            </div>
            <div className="pt-2 text-xs font-mono text-gray-400">
                ADM: {student.admissionNumber}
            </div>
        </div>
        <div className="flex flex-col gap-2 min-w-[150px]">
            <Button variant="outline" className="w-full">Download ID Card</Button>
            <Button className="w-full">View Timetable</Button>
        </div>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academics">Academics</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-500">Full Name</div>
                            <div className="font-medium">{student.name}</div>
                            
                            <div className="text-gray-500">Date of Birth</div>
                            <div className="font-medium">{student.dob ? new Date(student.dob).toDateString() : "-"}</div>
                            
                            <div className="text-gray-500">Gender</div>
                            <div className="font-medium">Not Specified</div>
                            
                            <div className="text-gray-500">Blood Group</div>
                            <div className="font-medium">--</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-500">Father&apos;s Name</div>
                            <div className="font-medium">{student.fatherName || "N/A"}</div>
                            
                            <div className="text-gray-500">Mother&apos;s Name</div>
                            <div className="font-medium">{student.motherName || "N/A"}</div>
                            
                            <div className="text-gray-500">Mobile</div>
                            <div className="font-medium">{student.mobile || "N/A"}</div>
                            
                            <div className="text-gray-500">Address</div>
                            <div className="font-medium">{student.address || "N/A"}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* TAB 2: ACADEMICS (Placeholder Data) */}
        <TabsContent value="academics" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" /> Recent Performance
                    </CardTitle>
                    <CardDescription>Latest term assessment results.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentGrades.map((subject) => (
                            <div key={subject.subject} className="bg-gray-50 p-4 rounded-lg border flex flex-col items-center justify-center text-center">
                                <h4 className="font-medium text-gray-700">{subject.subject}</h4>
                                <div className="text-3xl font-bold text-gray-900 my-2">{subject.grade}</div>
                                <span className="text-xs text-muted-foreground">{subject.score}% Marks</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>Detailed exam reports and downloadable report cards will be available here after the Mid-Term examinations are concluded.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        {/* TAB 3: ATTENDANCE (Placeholder Data) */}
        <TabsContent value="attendance" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" /> Attendance Record
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Overall Attendance</span>
                            <span className="text-sm font-bold text-green-600">{attendancePercentage}%</span>
                        </div>
                        <Progress value={attendancePercentage} className="h-3 bg-gray-100" />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">45</div>
                            <div className="text-xs text-gray-500 uppercase">Total Days</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50 border-green-100">
                            <div className="text-2xl font-bold text-green-700">41</div>
                            <div className="text-xs text-green-600 uppercase">Present</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-red-50 border-red-100">
                            <div className="text-2xl font-bold text-red-700">4</div>
                            <div className="text-xs text-red-600 uppercase">Absent</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}