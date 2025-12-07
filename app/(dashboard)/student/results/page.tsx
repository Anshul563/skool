import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy, TrendingUp, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export default async function StudentResultsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "student") return redirect("/sign-in");

  // Mock Data
  const results = [
    { subject: "Mathematics", marks: 95, total: 100, grade: "A+" },
    { subject: "Physics", marks: 88, total: 100, grade: "A" },
    { subject: "Chemistry", marks: 76, total: 100, grade: "B+" },
    { subject: "English", marks: 90, total: 100, grade: "A+" },
    { subject: "Computer Sci", marks: 98, total: 100, grade: "O" },
  ];

  const totalObtained = results.reduce((acc, curr) => acc + curr.marks, 0);
  const totalMax = results.reduce((acc, curr) => acc + curr.total, 0);
  const percentage = Math.round((totalObtained / totalMax) * 100);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Exam Results</h1>
        <p className="text-muted-foreground">Mid-Term Examination 2024</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-500/10 border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Overall Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-900">A+</div>
            <p className="text-xs text-emerald-600 mt-1">
              Excellent Performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold ">
              {percentage}%
            </div>
            <Progress value={percentage} className="h-2 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Total Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold ">
              {totalObtained}
            </div>
            <p className="text-xs text-gray-500 mt-1">Out of {totalMax}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((res) => (
                <TableRow key={res.subject}>
                  <TableCell className="font-medium">{res.subject}</TableCell>
                  <TableCell>{res.marks}</TableCell>
                  <TableCell>{res.total}</TableCell>
                  <TableCell className="text-right font-bold text-gray-700">
                    {res.grade}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
