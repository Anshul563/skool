import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { students } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertCircle 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StudentDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Fetch Profile Data
  const profile = await db.query.students.findFirst({
    where: eq(students.userId, session.user.id)
  });

  if (!profile) return <div>Student profile not found. Contact Admin.</div>;

  return (
    <div className="p-8 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-emerald-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-2xl font-bold">
                Welcome back, {profile.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-emerald-100 mt-2 max-w-lg">
                You are in <strong>Class {profile.grade}-{profile.section}</strong>. 
                
            </p>
            <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-emerald-800 text-emerald-100 hover:bg-emerald-700 border-0">
                    Addmission No: {profile.admissionNumber}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-800 text-emerald-100 hover:bg-emerald-700 border-0">
                    Roll No: {profile.rollNumber}
                </Badge>
            </div>
        </div>
        {/* Abstract Background Decoration */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-800 to-transparent opacity-50" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">--%</div>
                <p className="text-xs text-muted-foreground">Current Term</p>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fee Status</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Paid</div>
                <p className="text-xs text-muted-foreground">No dues pending</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Class</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">--:--</div>
                <p className="text-xs text-muted-foreground">Timetable not synced</p>
            </CardContent>
        </Card>
      </div>

      {/* Schedule Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Today's Schedule
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed rounded-lg bg-card">
                    <p>No classes scheduled for today.</p>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>Notice Board</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="text-sm text-gray-500 text-center py-8">
                    No recent notices from school admin.
                 </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}