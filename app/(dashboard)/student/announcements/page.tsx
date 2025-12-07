import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { announcements } from "@/src/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { Calendar, Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default async function StudentAnnouncementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "student") return redirect("/sign-in");

  // Fetch Announcements (Targeting 'ALL' or 'STUDENT')
  const list = await db
    .select()
    .from(announcements)
    .where(
      or(
        eq(announcements.audience, "ALL"),
        eq(announcements.audience, "STUDENT")
      )
    )
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight ">
          School Announcements
        </h1>
        <p className="text-muted-foreground">
          Stay updated with the latest news and notices.
        </p>
      </div>

      <div className="space-y-2">
        {list.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Megaphone className="h-10 w-10 mb-4 text-gray-300" />
              <p>No announcements at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          list.map((item) => (
            <Card key={item.id} className="overflow-hidden  shadow-sm hover:shadow-md transition">
              <CardHeader className="pb-3 ">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : ""}
                    </div>
                  </div>
                  <Badge 
                    variant={item.audience === "ALL" ? "secondary" : "default"}
                    className={item.audience === "ALL" ? "bg-gray-200 text-gray-700 hover:bg-gray-200" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"}
                  >
                    {item.audience === "ALL" ? "General" : "Student Notice"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                {/* Text Content */}
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>

                {/* Image Display */}
                {item.type === "IMAGE" && item.imageUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-auto max-h-[400px] object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}