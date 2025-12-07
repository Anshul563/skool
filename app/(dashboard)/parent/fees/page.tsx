import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db"; // Ensure this is correct
import {
  parents,
  students,
  feeRecords,
  payments,
  schoolSettings,
} from "@/src/db/schema"; // Ensure this is correct
import { eq, inArray, desc } from "drizzle-orm";
import { CreditCard, AlertCircle, CheckCircle } from "lucide-react";

// Shadcn UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Components
import { DownloadReceiptButton } from "@/components/download-receipt-button";
import { PayFeeButton } from "@/components/pay-fee-button"; // Reuse payment button

export default async function ParentFeesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "parent") {
    return redirect("/sign-in");
  }

  // 1. Get Parent Profile ID
  const [parentProfile] = await db
    .select({ id: parents.id, name: parents.name, email: parents.email })
    .from(parents)
    .where(eq(parents.userId, session.user.id));

  if (!parentProfile) {
    return (
      <div className="p-8">
        Parent profile not found. Please contact support.
      </div>
    );
  }

  // 2. Get All Children (Students) for this Parent
  const children = await db
    .select({
      id: students.id,
      name: students.name,
      grade: students.grade,
      section: students.section,
      admissionNumber: students.admissionNumber,
      // If exists, otherwise assume parent email for receipt
    })
    .from(students)
    .where(eq(students.parentId, session.user.id));

  if (children.length === 0) {
    return <div className="p-8">No students linked to your account.</div>;
  }

  const studentIds = children.map((s) => s.id);

  // 3. Fetch Fees & Payments for ALL Children
  const [allFees, allPayments] = await Promise.all([
    // Get all bills
    db
      .select()
      .from(feeRecords)
      .where(inArray(feeRecords.studentId, studentIds)),

    // Get all transactions
    db
      .select()
      .from(payments)
      .where(inArray(payments.studentId, studentIds))
      .orderBy(desc(payments.createdAt)),
  ]);

  // 4. Calculate Totals
  const totalOutstanding = allFees.reduce(
    (acc, curr) => acc + (curr.amount - curr.amountPaid),
    0
  );

  const settings = await db.query.schoolSettings.findFirst({
    where: eq(schoolSettings.id, 1),
  });

  const schoolData = {
    schoolName: settings?.schoolName || "My School",
    schoolAddress: settings?.schoolAddress || "School Address",
    schoolPhone: settings?.schoolPhone,
    schoolEmail: settings?.schoolEmail,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Fee Payments</h1>
        <p className="text-muted-foreground">
          Manage school fees for your children.
        </p>
      </div>

      {/* --- STATUS OVERVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className={
            totalOutstanding > 0
              ? "border-red-200 bg-red-50/40"
              : "border-green-200 bg-green-50/40"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle
              className={`text-sm font-medium flex items-center gap-2 ${
                totalOutstanding > 0 ? "text-red-700" : "text-green-700"
              }`}
            >
              {totalOutstanding > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                totalOutstanding > 0 ? "text-red-700" : "text-green-700"
              }`}
            >
              ₹{(totalOutstanding / 100).toLocaleString("en-IN")}
            </div>
            <p
              className={`text-xs mt-1 ${
                totalOutstanding > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              Total dues across {children.length} student(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABS --- */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="pending">Pending Dues</TabsTrigger>
        </TabsList>

        {/* 1. TRANSACTION HISTORY TAB */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Payment history for all your children.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No payments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPayments.map((pay) => {
                      const student = children.find(
                        (c) => c.id === pay.studentId
                      );
                      return (
                        <TableRow key={pay.id}>
                          <TableCell>
                            {pay.paidAt
                              ? new Date(pay.paidAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student?.name}
                          </TableCell>
                          <TableCell>{pay.description}</TableCell>
                          <TableCell>
                            ₹{(pay.amount / 100).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                pay.status === "PAID"
                                  ? "default"
                                  : "destructive"
                              }
                              className={
                                pay.status === "PAID"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : ""
                              }
                            >
                              {pay.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {pay.status === "PAID" && student && (
                              <DownloadReceiptButton
                                paymentData={{
                                  id: pay.id,
                                  amount: pay.amount,
                                  date: pay.paidAt,
                                  description: pay.description,
                                  paymentMode: pay.paymentMode,
                                  transactionId:
                                    pay.razorpayPaymentId ||
                                    (pay.paymentMode === "CASH"
                                      ? `CASH-${pay.id}`
                                      : null),
                                }}
                                studentData={{
                                  name: student.name,
                                  grade: student.grade || "",
                                  section: student.section || "",
                                  admissionNo: student.admissionNumber,
                                }}
                                // Pass default or fetched settings
                                schoolSettings={schoolData}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. PENDING DUES TAB */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Fee Bills</CardTitle>
              <CardDescription>Outstanding monthly fees.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFees.filter((f) => f.status !== "PAID").length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center h-24 text-muted-foreground text-green-600"
                      >
                        No pending dues. Good job!
                      </TableCell>
                    </TableRow>
                  ) : (
                    allFees
                      .filter((f) => f.status !== "PAID")
                      .map((bill) => {
                        const student = children.find(
                          (c) => c.id === bill.studentId
                        );
                        const balance = bill.amount - bill.amountPaid;
                        return (
                          <TableRow key={bill.id}>
                            <TableCell className="text-red-600 font-medium">
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {student?.name}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                bill.year,
                                bill.month - 1
                              ).toLocaleString("default", { month: "long" })}
                            </TableCell>
                            <TableCell>
                              ₹{(bill.amount / 100).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-green-600">
                              ₹{(bill.amountPaid / 100).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="font-bold text-red-600">
                              ₹{(balance / 100).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Reusing PayFeeButton logic but wrapped for simple invocation */}
                              <PayFeeButton
                                studentId={bill.studentId}
                                feeRecordId={bill.id}
                                amount={balance}
                                studentName={student?.name || "Student"}
                                email={parentProfile.email || ""} // Use parent email for payment notification
                                mobile=""
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
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
