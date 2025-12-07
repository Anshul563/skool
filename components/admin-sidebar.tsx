"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu,
  School,
  SpeechIcon,
  Book,
  Clock
} from "lucide-react";
import { useState } from "react";
import { ModeToggle } from "./ModeToggle";

// Menu Items Configuration
const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Teachers",
    href: "/admin/teachers",
    icon: Users,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    title: "Classes", // We'll build this later
    href: "/admin/classes",
    icon: BookOpen,
  },
  {
    title: "Finance", // We'll build this later
    href: "/admin/finance",
    icon: CreditCard,
  },
  {
    title: "Announcements", // We'll build this later
    href: "/admin/announcements",
    icon: SpeechIcon,
  },
  {
    title: "Manage Timetable", // We'll build this later
    href: "/admin/timetable",
    icon: Clock,
  },
  {
    title: "Manage Subjects", // We'll build this later
    href: "/admin/subjects",
    icon: Book,
  },
  {
    title: "Settings", // We'll build this later
    href: "/admin/settings",
    icon: Settings,
  },
];

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function AdminSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  return (
    <div className={cn("pb-12 h-screen border-r bg-background", className)}>
      <div className="space-y-4 py-4">
        {/* Logo Section */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-4 mb-6">
             <div className="bg-primary p-2 rounded-lg">
                <School className="h-6 w-6 text-white" />
             </div>
             <h2 className="text-xl font-bold tracking-tight">Skool</h2>
          </div>
          <div className="space-y-1">
            {sidebarItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2", 
                  pathname === item.href && "bg-secondary font-medium"
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
      
      {/* Logout Button (Fixed at bottom) */}
      <div className="flex gap-3 absolute bottom-4 w-full px-4">
        <Button 
            variant="outline" 
            className="w-[70%] justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
        <ModeToggle/>
      </div>
    </div>
  );
}

// Mobile Navigation Component
export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
                <AdminSidebar />
            </SheetContent>
        </Sheet>
    );
}