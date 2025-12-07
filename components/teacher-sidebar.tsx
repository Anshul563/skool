"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ClipboardCheck, 
  LogOut, 
  Menu,
  School
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const teacherItems = [
  {
    title: "Dashboard",
    href: "/teacher",
    icon: LayoutDashboard,
  },
  {
    title: "My Classes",
    href: "/teacher/classes",
    icon: Users,
  },
  {
    title: "Schedule",
    href: "/teacher/schedule",
    icon: CalendarDays,
  },
  {
    title: "Mark Attendance",
    href: "/teacher/attendance",
    icon: ClipboardCheck,
  },
];

export function TeacherSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/sign-in") },
    });
  };

  return (
    <div className={cn("pb-12 h-screen border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-4 mb-6">
             <div className="bg-blue-600 p-2 rounded-lg">
                <School className="h-6 w-6 text-white" />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-blue-900">Skool Teacher</h2>
          </div>
          <div className="space-y-1">
            {teacherItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2", 
                  pathname === item.href && "bg-card text-blue-700 font-medium"
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 absolute bottom-4 w-full px-4">
        <Button variant="outline" className="w-[70%] justify-start gap-2 text-red-500" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
        <ModeToggle/>
      </div>
    </div>
  );
}

export function TeacherMobileSidebar() {
    const [open, setOpen] = useState(false);
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72"><TeacherSidebar /></SheetContent>
        </Sheet>
    );
}