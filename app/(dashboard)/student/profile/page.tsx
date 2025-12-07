import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, parents } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { ChangePasswordForm } from "@/components/change-password-form";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  School,
  ShieldCheck,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "student") {
    return redirect("/sign-in");
  }

  // 1. Fetch Student Profile
  const studentProfile = await db.query.students.findFirst({
    where: eq(students.userId, session.user.id),
  });

  if (!studentProfile) return <div>Profile not found</div>;

  // 2. Fetch Linked Parent Profile (if exists)
  let parentProfile = null;
  if (studentProfile.parentId) {
    parentProfile = await db.query.parents.findFirst({
      where: eq(parents.userId, studentProfile.parentId),
    });
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
          <AvatarImage
            src={studentProfile.profileImage || session.user.image || ""}
            className="object-cover"
          />
          <AvatarFallback className="text-2xl bg-slate-200">
            {studentProfile.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{studentProfile.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <School className="h-4 w-4" />
            <span>
              Class {studentProfile.grade} - Section {studentProfile.section}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">Roll No: {studentProfile.rollNumber}</Badge>
            <Badge variant="secondary">
              Addmission No: {studentProfile.admissionNumber}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="security">Security & Settings</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: DETAILS --- */}
        <TabsContent value="details" className="space-y-6 mt-6">
          {/* Personal Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Full Name</span>
                <p className="font-medium">{studentProfile.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Date of Birth</span>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {studentProfile.dob
                    ? new Date(studentProfile.dob).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Mobile Number</span>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {studentProfile.mobile || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500">Email Address</span>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {session.user.email}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-sm text-gray-500">
                  Residential Address
                </span>
                <p className="font-medium flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-1" />
                  {studentProfile.address || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Parents / Guardian Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Family &
                Guardian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Biological Parents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">
                    Father&apos;s Name
                  </span>
                  <p className="font-medium">{studentProfile.fatherName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500">
                    Mother&apos;s Name
                  </span>
                  <p className="font-medium">{studentProfile.motherName}</p>
                </div>
              </div>

              {/* Linked Guardian Account */}
              <div>
                <h4 className="text-sm font-semibold mb-4 ">
                  Linked Guardian Account
                </h4>
                {parentProfile ? (
                  <div className=" p-4 rounded-lg flex items-start gap-4 border">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 " />
                    </div>
                    <div>
                      <p className="font-bold ">
                        {parentProfile.name}
                      </p>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p className="flex items-center gap-2">
                          <Mail className="h-3 w-3" /> {parentProfile.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-3 w-3" /> {parentProfile.mobile}
                        </p>
                        
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic  p-4 rounded-lg border border-dashed text-center">
                    No guardian account linked. Contact admin to link a parent
                    account for online fee payments.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: SECURITY --- */}
        <TabsContent value="security" className="mt-6">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
