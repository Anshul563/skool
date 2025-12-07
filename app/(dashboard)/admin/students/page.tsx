import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { students, user } from "@/src/db/schema"; 
import { eq, desc } from "drizzle-orm";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Search,
  FileSpreadsheet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default async function StudentsListPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return redirect("/sign-in");
  }

  // ✅ UPDATED QUERY: Removed 'classId', Added 'grade' and 'section'
  const studentList = await db
    .select({
      id: students.id,
      name: students.name,
      admissionNumber: students.admissionNumber,
      rollNumber: students.rollNumber,
      // FIX: Fetch Grade and Section directly
      grade: students.grade,
      section: students.section,
      profileImage: students.profileImage,
      email: user.email, 
      createdAt: students.createdAt,
    })
    .from(students)
    .leftJoin(user, eq(students.userId, user.id))
    .orderBy(desc(students.createdAt)); // Optional: Show newest first

  return (
    <div className="p-8 bg-background space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage admissions and student records ({studentList.length} total)
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Link href="/admin/students/new">
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Student
                </Button>
            </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-2 bg-card p-1 rounded-md border w-full md:w-96">
        <Search className="ml-2 h-4 w-4 text-gray-400" />
        <Input 
            placeholder="Search by name or admission no..." 
            className="border-0 focus-visible:ring-0"
        />
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[300px]">Student Name</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>Class / Roll</TableHead>
              <TableHead>Parent Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                        <p>No students enrolled yet.</p>
                        <p className="text-xs mt-1">Click &quot;Add Student&quot; to start admissions.</p>
                    </div>
                </TableCell>
              </TableRow>
            ) : (
              studentList.map((s) => (
                <TableRow key={s.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={s.profileImage || ""} />
                        <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                          {s.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">Joined {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-mono text-xs  px-2 py-1 rounded">
                        {s.admissionNumber || "PENDING"}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                       {/* FIX: Display Grade and Section */}
                       Class {s.grade}-{s.section} <span className="text-gray-400">|</span> Roll {s.rollNumber ? s.rollNumber.slice(-2) : "-"}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                        {s.rollNumber}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-gray-500">
                        {s.email}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" /> Edit Student
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Discharge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}