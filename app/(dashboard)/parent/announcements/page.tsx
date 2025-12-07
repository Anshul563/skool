import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { announcements } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { Bell, Calendar } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ParentAnnouncementsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "parent") return redirect("/sign-in");

  // Fetch announcements for "ALL"
  const list = await db
    .select()
    .from(announcements)
    .where(eq(announcements.audience, "ALL"))
    .orderBy(desc(announcements.createdAt));

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notices & Circulars</h1>
        <p className="text-muted-foreground">Official communication from the school administration.</p>
      </div>

      <div className="space-y-6">
        {list.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No new notices.</div>
        ) : (
          list.map((item) => (
            <Card key={item.id} className="">
              <CardHeader className=" pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                        </div>
                    </div>
                    <Badge variant="secondary">General Notice</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                 <p className="text-gray-700 whitespace-pre-wrap">{item.content}</p>
                 {item.type === "IMAGE" && item.imageUrl && (
                    <img src={item.imageUrl} alt="Notice" className="mt-4 rounded-lg max-h-96 object-cover border" />
                 )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}