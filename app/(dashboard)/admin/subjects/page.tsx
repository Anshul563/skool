import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { subjects } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { CreateSubjectForm } from "@/components/create-subject-form";
import { deleteSubjectAction } from "@/actions/subject-actions";
import { Trash2, Book, Hash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SubjectsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return redirect("/sign-in");

  // Fetch Subjects
  const subjectList = await db
    .select()
    .from(subjects)
    .orderBy(desc(subjects.createdAt));

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Subject Management
        </h1>
        <p className="text-muted-foreground">
          Manage the list of subjects taught in the school.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Create Form */}
        <div className="lg:col-span-1">
          <CreateSubjectForm />
        </div>

        {/* Right: Subject List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" /> Existing Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjectList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No subjects found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subjectList.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                              {sub.name.charAt(0)}
                            </div>
                            {sub.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Hash className="h-3 w-3" />
                            {sub.code}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <form
                            action={async () => {
                              "use server";
                              await deleteSubjectAction(sub.id);
                            }}
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
