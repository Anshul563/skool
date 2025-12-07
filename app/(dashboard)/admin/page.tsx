import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teachers, students } from "@/src/db/schema";
import { count } from "drizzle-orm";
import Link from "next/link";
import { Users, GraduationCap, Plus, ArrowRight, School } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  // 1. Verify Authentication & Role
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return redirect("/sign-in");
  }

  // 2. Fetch Real Stats from Database (Parallel for speed)
  const [teacherCount] = await db.select({ value: count() }).from(teachers);
  const [studentCount] = await db.select({ value: count() }).from(students);

  return (
    <div className="p-8 bg-background space-y-8">
      {/* Header Section */}
      <div className="flex flex-col bg-background md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {session.user.name}. Here is what&apos;s happening at your
            school.
          </p>
        </div>
        <div className="flex gap-2">
          {/* We will build this page next */}
          <Link href="/admin/teachers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Students Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount.value}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>

        {/* Total Teachers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherCount.value}</div>
            <p className="text-xs text-muted-foreground">
              Active staff members
            </p>
          </CardContent>
        </Card>

        {/* Classes Card (Placeholder for now) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Classes
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Academic Year 2024-25
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links / Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Content Area (e.g., Charts in future) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg">
              Analytics Chart Placeholder
            </div>
          </CardContent>
        </Card>

        {/* Recent Actions / Sidebar */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-background transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Manage Teachers</p>
                  <p className="text-sm text-gray-500">
                    View and edit staff profiles
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-background transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Manage Students</p>
                  <p className="text-sm text-gray-500">
                    Admissions and promotions
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
