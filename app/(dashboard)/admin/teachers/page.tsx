import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { teachers, user } from "@/src/db/schema"; // Import both tables
import { eq } from "drizzle-orm";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

export default async function TeachersListPage() {
  // 1. Security Check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return redirect("/sign-in");
  }

  // 2. Fetch Teachers with Email (Join with User table)
  // We join 'teachers' with 'user' because email is stored in the Auth table
  const teacherList = await db
    .select({
      id: teachers.id,
      name: teachers.name,
      subject: teachers.subjectSpecialization,
      mobile: teachers.mobile,
      profileImage: teachers.profileImage,
      email: user.email, // Get email from the linked auth user
      experience: teachers.experienceYears,
      qualification: teachers.qualification,
    })
    .from(teachers)
    .leftJoin(user, eq(teachers.userId, user.id));

  return (
    <div className="p-8 bg-background space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your academic staff ({teacherList.length} total)
          </p>
        </div>
        <Link href="/admin/teachers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-background shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-background/50">
              <TableHead className="w-[250px]">Teacher</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teacherList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No teachers found. Click &quot;Add Teacher&quot; to create
                  one.
                </TableCell>
              </TableRow>
            ) : (
              teacherList.map((t) => (
                <TableRow key={t.id} className="">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={t.profileImage || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {t.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.qualification}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-background text-blue-800">
                      {t.subject}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" /> {t.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" /> {t.mobile || "N/A"}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">{t.experience} Years</div>
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
                          <Pencil className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Remove Teacher
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
