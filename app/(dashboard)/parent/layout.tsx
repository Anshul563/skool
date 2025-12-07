import { ParentSidebar, ParentMobileSidebar } from "@/components/parent-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/db"; 
import { parents } from "@/src/db/schema"; 
import { eq } from "drizzle-orm"; 

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Security: Only allow Parents
  if (!session || session.user.role !== "parent") {
    return redirect("/sign-in");
  }

  // Fetch Parent Profile
  const parentProfile = await db.query.parents.findFirst({
    where: eq(parents.userId, session.user.id),
  });

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block w-64 fixed h-full z-10">
        <ParentSidebar />
      </div>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <ParentMobileSidebar />
                <span className="font-semibold md:hidden">Parent Portal</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium leading-none">{parentProfile?.name || session.user.name}</p>
                    <p className="text-xs text-muted-foreground">Guardian</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-orange-100">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                        {parentProfile?.name ? parentProfile.name.charAt(0).toUpperCase() : "P"}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}