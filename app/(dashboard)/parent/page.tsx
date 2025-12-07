import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { students, parents, announcements } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Users,
  Bell,
  ArrowRight,
  GraduationCap,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ParentDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // 1. Fetch Parent Profile to get Name
  const parentProfile = await db.query.parents.findFirst({
    where: eq(parents.userId, session.user.id),
  });

  // 2. Fetch Children (Students linked to this parent)
  const myChildren = await db.query.students.findMany({
    where: eq(students.parentId, session.user.id),
    orderBy: [desc(students.createdAt)],
  });

  // 3. Fetch General Announcements
  const notices = await db
    .select()
    .from(announcements)
    .where(eq(announcements.audience, "ALL"))
    .orderBy(desc(announcements.createdAt))
    .limit(3);

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, Mr/Ms. {parentProfile?.name || session.user.name}
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your children&apos;s performance and school
          updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COL: Children List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" /> My Children
          </h2>

          {myChildren.length === 0 ? (
            <Card className="bg-orange-50 border-orange-100">
              <CardContent className="flex flex-col items-center justify-center h-40 text-orange-800">
                <p>No students linked to your account.</p>
                <p className="text-sm mt-1 opacity-70">
                  Please contact school administration.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myChildren.map((child) => (
                <Card
                  key={child.id}
                  className="hover:shadow-md transition cursor-pointer "
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={child.profileImage || ""} />
                          <AvatarFallback>
                            {child.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {child.name}
                          </CardTitle>
                          <CardDescription>
                            Class {child.grade}-{child.section}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Roll:{" "}
                        {child.rollNumber ? child.rollNumber.slice(-2) : "-"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 mt-2 space-y-1">
                      <p>
                        Admission No:{" "}
                        <span className="text-gray-900 font-medium">
                          {child.admissionNumber}
                        </span>
                      </p>
                      <p>
                        Attendance:{" "}
                        <span className="text-green-600 font-bold">92%</span>{" "}
                        (This Term)
                      </p>
                    </div>
                    <Button className="w-full mt-4" variant="secondary" asChild>
                      <Link href={`/parent/children/${child.id}`}>
                        View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COL: Notices & Fees */}
        <div className="space-y-6">
          {/* Notices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-gray-500" /> School Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {notices.length === 0 ? (
                <p className="text-sm text-gray-500">No new notices.</p>
              ) : (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="border-b pb-3 last:border-0 last:pb-0"
                  >
                    <p className="font-medium text-sm line-clamp-1">
                      {notice.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notice.createdAt
                        ? new Date(notice.createdAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                ))
              )}
              <Button
                variant="link"
                className="w-full h-auto p-0 text-xs"
                asChild
              >
                <Link href="/parent/announcements">View All Notices</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Fee Status */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-gray-400 mt-1">
                Total Outstanding Dues
              </p>
              <Button
                size="sm"
                className="w-full mt-4 bg-white text-black hover:bg-gray-200"
              >
                Pay Fees Online
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
