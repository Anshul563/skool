import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { feeStructure, classes, payments, students } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

// Components
import { FeeStructureForm } from "@/components/fee-structure-form";
import { CashPaymentForm } from "@/components/cash-payment-form";
import { GenerateFeesButton } from "@/components/generate-fees-button";

export default async function AdminFinancePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/sign-in");

  // Fetch Data in Parallel
  const [classFees, paymentHistory] = await Promise.all([
    // 1. Fee Structures
    db.select({
      classId: classes.id,
      grade: classes.grade,
      section: classes.section,
      amount: feeStructure.monthlyAmount,
    })
    .from(classes)
    .leftJoin(feeStructure, eq(classes.id, feeStructure.classId))
    .orderBy(classes.grade),

    // 2. Transaction History (New Query)
    db.select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      mode: payments.paymentMode,
      date: payments.paidAt,
      description: payments.description,
      studentName: students.name,
      grade: students.grade,
      section: students.section,
    })
    .from(payments)
    .leftJoin(students, eq(payments.studentId, students.id))
    .orderBy(desc(payments.createdAt))
    .limit(50) // Limit to last 50 transactions for performance
  ]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
          <p className="text-muted-foreground">Set fees, collect cash payments, and manage dues.</p>
        </div>
        <GenerateFeesButton />
      </div>

      <Tabs defaultValue="collect" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="collect">Collect Fees (Cash)</TabsTrigger>
          <TabsTrigger value="structure">Fee Structure</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        {/* 1. COLLECT CASH TAB */}
        <TabsContent value="collect" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Record Cash Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <CashPaymentForm />
              </CardContent>
            </Card>
            
            {/* Helper Info */}
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-2">How this works</h3>
                <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                  <li>Search for a student by name or admission number.</li>
                  <li>System automatically finds the <strong>oldest pending fee</strong>.</li>
                  <li>Enter the cash amount received.</li>
                  <li>Receipt email is sent automatically.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. FEE STRUCTURE TAB */}
        <TabsContent value="structure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Set Monthly Fees per Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classFees.map((item) => (
                  <FeeStructureForm 
                    key={item.classId} 
                    classId={item.classId} 
                    className={`${item.grade}-${item.section}`}
                    currentAmount={item.amount ? item.amount / 100 : 0} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. HISTORY TAB (Updated) */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No transactions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="text-muted-foreground">
                          {txn.date ? new Date(txn.date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{txn.studentName || "Unknown"}</TableCell>
                        <TableCell>{txn.grade}-{txn.section}</TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell>₹{(txn.amount / 100).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{txn.mode}</Badge>
                        </TableCell>
                        <TableCell>
                          {txn.status === "PAID" && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                            </Badge>
                          )}
                          {txn.status === "PENDING" && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                          {txn.status === "FAILED" && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" /> Failed
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}