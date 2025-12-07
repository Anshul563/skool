import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { announcements } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { CreateAnnouncementForm } from "@/components/create-announcement-form";
import { Bell, Trash2, Calendar, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteAnnouncementAction } from "@/actions/announcement-actions"; // Helper for delete button

export default async function AnnouncementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return redirect("/sign-in");

  // Fetch Announcements (Newest first)
  const list = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">
          Broadcast messages to your school community.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-1">
          <CreateAnnouncementForm />
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" /> Active Announcements
              </CardTitle>
              <CardDescription>History of all posted messages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {list.length === 0 ? (
                <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
                  No announcements found.
                </div>
              ) : (
                list.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-background  transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{item.title}</h3>
                          <Badge
                            variant={
                              item.audience === "ALL" ? "default" : "secondary"
                            }
                          >
                            {item.audience}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-gray-400 gap-2">
                          <Calendar className="h-3 w-3" />
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : ""}
                        </div>
                      </div>

                      {/* Delete Button (Simple form action for speed) */}
                      <form
                        action={async () => {
                          "use server";
                          await deleteAnnouncementAction(item.id);
                        }}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>

                    {/* Content Display */}
                    <div className="text-sm text-gray-700 mt-2">
                      {item.content}
                    </div>

                    {/* Image Display */}
                    {item.type === "IMAGE" && item.imageUrl && (
                      <div className="mt-4 relative h-48 w-full rounded-md overflow-hidden border">
                        <img
                          src={item.imageUrl}
                          alt="Announcement"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
