import { StudentSidebar, StudentMobileSidebar } from "@/components/student-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db"; 
import { students } from "@/src/db/schema"; 
import { eq } from "drizzle-orm"; 

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Security: Only allow Students
  if (!session || session.user.role !== "student") {
    return redirect("/sign-in");
  }

  // Fetch Student Profile (to get the official profile image)
  const studentProfile = await db.query.students.findFirst({
    where: eq(students.userId, session.user.id),
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:block w-64 fixed h-full z-10">
        <StudentSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <StudentMobileSidebar />
                <span className="font-semibold md:hidden">Student Portal</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">{studentProfile?.name || session.user.name}</p>
                    <p className="text-xs text-muted-foreground">Class {studentProfile?.grade}-{studentProfile?.section}</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-emerald-100">
                    <AvatarImage src={studentProfile?.profileImage || session.user.image || ""} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {studentProfile?.name ? studentProfile.name.charAt(0).toUpperCase() : "S"}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}