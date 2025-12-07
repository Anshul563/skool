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
  Baby, 
  CreditCard, 
  Bell, 
  User,
  LogOut, 
  Menu,
  HeartHandshake
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const parentItems = [
  {
    title: "Dashboard",
    href: "/parent",
    icon: LayoutDashboard,
  },
  {
    title: "My Children",
    href: "/parent/children",
    icon: Baby,
  },
  {
    title: "Fee Payments",
    href: "/parent/fees",
    icon: CreditCard,
  },
  {
    title: "Notices",
    href: "/parent/announcements",
    icon: Bell,
  },
  {
    title: "My Profile",
    href: "/parent/profile",
    icon: User,
  },
];

export function ParentSidebar({ className }: { className?: string }) {
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
             <div className="bg-orange-500 p-2 rounded-lg">
                <HeartHandshake className="h-6 w-6 text-white" />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-orange-900">Skool Parent</h2>
          </div>
          <div className="space-y-1">
            {parentItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2", 
                  pathname === item.href && "bg-card text-orange-700 font-medium"
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
        <Button variant="outline" className="w-[80%] justify-start gap-2 text-red-500" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
        <ModeToggle/>
      </div>
    </div>
  );
}

export function ParentMobileSidebar() {
    const [open, setOpen] = useState(false);
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72"><ParentSidebar /></SheetContent>
        </Sheet>
    );
}