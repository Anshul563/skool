import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { School, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ParentChildrenPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "parent") return redirect("/sign-in");

  const myChildren = await db.query.students.findMany({
    where: eq(students.parentId, session.user.id),
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground">
          View profiles and academic details of your wards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myChildren.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
            No children linked to this account.
          </div>
        ) : (
          myChildren.map((child) => (
            <Card key={child.id} className="overflow-hidden ">
              <CardHeader className=" pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      <AvatarImage src={child.profileImage || ""} />
                      <AvatarFallback className="text-lg  text-orange-700">
                        {child.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <School className="h-3 w-3" /> Class {child.grade}-
                        {child.section}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-semibold">
                    Roll No
                  </span>
                  <p className="font-medium">{child.rollNumber}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-semibold">
                    Date of Birth
                  </span>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {child.dob
                      ? new Date(child.dob).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t mt-2">
                  <span className="text-xs text-gray-400 uppercase font-semibold">
                    Attendance (Current Term)
                  </span>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-1">
                    92% Present
                  </p>
                </div>
                <Button className="w-full mt-4" variant="secondary" asChild>
                  <Link href={`/parent/children/${child.id}`}>
                    View Full Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
