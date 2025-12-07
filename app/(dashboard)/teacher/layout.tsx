import {
  TeacherSidebar,
  TeacherMobileSidebar,
} from "@/components/teacher-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db"; // 1. Import DB
import { teachers } from "@/src/db/schema"; // 2. Import Schema
import { eq } from "drizzle-orm"; // 3. Import Operator

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Security: Only allow Teachers
  if (!session || session.user.role !== "teacher") {
    return redirect("/sign-in");
  }

  // 4. Fetch the Teacher Profile to get the specific image
  const teacherProfile = await db.query.teachers.findFirst({
    where: eq(teachers.userId, session.user.id),
  });

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 fixed h-full z-10">
        <TeacherSidebar />
      </div>
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <TeacherMobileSidebar />
            <span className="font-semibold md:hidden">My Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium hidden sm:block">
              {teacherProfile?.name || session.user.name}
            </span>
            <Avatar className="h-8 w-8">
              {/* 5. Use the profile image from the DB, fallback to session image */}
              <AvatarImage
                src={teacherProfile?.profileImage || session.user.image || ""}
              />
              <AvatarFallback>
                {teacherProfile?.name
                  ? teacherProfile.name.charAt(0).toUpperCase()
                  : "T"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
