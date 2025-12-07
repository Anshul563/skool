import { AdminSidebar, MobileSidebar } from "@/components/admin-sidebar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Double check auth here to ensure security across all admin pages
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar - Hidden on mobile, visible on md+ */}
      <div className="hidden md:block w-64 fixed h-full z-10">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen bg-gray-50/50">
        
        {/* Top Header (Mobile Toggle + User Profile) */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <MobileSidebar />
                <span className="font-semibold md:hidden">Skool Admin</span>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                    <Avatar>
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
            {children}
        </main>
      </div>
    </div>
  );
}