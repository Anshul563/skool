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
  CalendarDays,
  CreditCard,
  Award,
  User,
  LogOut,
  Menu,
  GraduationCap,
  SpeechIcon,
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const studentItems = [
  {
    title: "Dashboard",
    href: "/student",
    icon: LayoutDashboard,
  },
  {
    title: "My Timetable",
    href: "/student/timetable",
    icon: CalendarDays,
  },
  {
    title: "Fee Payments",
    href: "/student/fees",
    icon: CreditCard,
  },
  {
    title: "Announcementss",
    href: "/student/announcements",
    icon: SpeechIcon,
  },
  {
    title: "Exam Results",
    href: "/student/results",
    icon: Award,
  },
  {
    title: "My Profile",
    href: "/student/profile",
    icon: User,
  },
];

export function StudentSidebar({ className }: { className?: string }) {
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
            <div className="bg-emerald-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-900">
              Skool Student
            </h2>
          </div>
          <div className="space-y-1">
            {studentItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  pathname === item.href &&
                    "bg-card text-emerald-700 font-medium"
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
      <div className="flex absolute bottom-4 gap-3 w-full px-4">
        <Button
          variant="outline"
          className="w-[70%] justify-start gap-2 text-red-500"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
        <ModeToggle/>
      </div>
    </div>
  );
}

export function StudentMobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="md:hidden" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <StudentSidebar />
      </SheetContent>
    </Sheet>
  );
}
