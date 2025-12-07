import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { teachers } from "@/src/db/schema"; // Import teachers table
import { eq } from "drizzle-orm";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  // Fetch Teacher Profile Details
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id)
  });

  return (
    <div className="p-8 space-y-6">
      {/* Welcome Section */}
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold ">
                    Welcome back, {teacherProfile?.name || session.user.name}
                </h1>
                <p className=" mt-1">
                    {teacherProfile?.qualification} • {teacherProfile?.subjectSpecialization} Department
                </p>
            </div>
            <div className="hidden md:block text-right">
                <p className="text-sm font-medium ">Today</p>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Active classes assigned</p>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Class</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">--:--</div>
                <p className="text-xs text-muted-foreground">No classes scheduled</p>
            </CardContent>
        </Card>
      </div>

      {/* Schedule Placeholder */}
      <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed rounded-lg bg-card">
                <p>No timetable data found.</p>
                <p className="text-xs">Contact admin to assign classes.</p>
             </div>
          </CardContent>
        </Card>
    </div>
  );
}