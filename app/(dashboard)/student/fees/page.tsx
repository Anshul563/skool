import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db"; // Ensure this path is correct
import { students, payments, feeRecords, user, schoolSettings } from "@/src/db/schema"; // ✅ Added 'user' table import
import { eq, desc } from "drizzle-orm";
import {CheckCircle, AlertCircle } from "lucide-react";

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

// ✅ Import Client Components
import { PayFeeButton } from "@/components/pay-fee-button";
import { DownloadReceiptButton } from "@/components/download-receipt-button";

export default async function StudentFeesPage() {
  // 1. Auth Check
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || session.user.role !== "student") {
    return redirect("/sign-in");
  }

  // 2. Get Student Details (Joined with User Table for Email)
  // We need the email for the receipt, but it lives in the 'user' table
  const [studentProfile] = await db
    .select({
      id: students.id,
      name: students.name,
      email: user.email, // ✅ Fetch Email from User table
      mobile: students.mobile,
      grade: students.grade,
      section: students.section,
      admissionNo: students.admissionNumber,
    })
    .from(students)
    .leftJoin(user, eq(students.userId, user.id)) // ✅ Join Logic
    .where(eq(students.userId, session.user.id));

  if (!studentProfile) {
    return <div className="p-8">Student profile not found. Please contact support.</div>;
  }

  // 3. Fetch Data in Parallel (Bills & Payment History)
  const [feeBills, paymentHistory] = await Promise.all([
    // A. All Monthly Bills generated for this student
    db.select().from(feeRecords).where(eq(feeRecords.studentId, studentProfile.id)),
    
    // B. All Payments made by this student (Online + Cash)
    db.select()
      .from(payments)
      .where(eq(payments.studentId, studentProfile.id))
      .orderBy(desc(payments.createdAt))
  ]);

  const settings = await db.query.schoolSettings.findFirst({
    where: eq(schoolSettings.id, 1)
  });

  const schoolData = {
    schoolName: settings?.schoolName || "My School",
    schoolAddress: settings?.schoolAddress || "School Address",
    schoolPhone: settings?.schoolPhone,
    schoolEmail: settings?.schoolEmail
  };

  // 4. Calculate Financial Stats
  const totalBilled = feeBills.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Total Paid (Sum of all successful transactions)
  const totalPaid = paymentHistory.reduce((acc, curr) => acc + (curr.status === "PAID" ? curr.amount : 0), 0);
  
  // Outstanding Balance Calculation
  // We sum up the remaining balance on all unpaid/partially paid bills
  const outstandingBalance = feeBills.reduce((acc, curr) => acc + (curr.amount - curr.amountPaid), 0);
  
  // Calculate Progress Percentage
  const progressPercentage = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  // Find the earliest due bill that is NOT fully paid
  const nextDueBill = feeBills
    .filter(f => f.status !== "PAID")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Fee Payments</h1>
        <p className="text-muted-foreground">
          View your fee structure and payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- STATUS CARD --- */}
        <Card className={outstandingBalance > 0 ? "border-red-200 bg-red-50/30" : "border-green-200 bg-green-50/30"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${outstandingBalance > 0 ? "text-red-700" : "text-green-700"}`}>
              {outstandingBalance > 0 ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              {outstandingBalance > 0 ? "Outstanding Balance" : "All Caught Up"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
                ₹{(outstandingBalance / 100).toLocaleString("en-IN")}
            </div>
            
            {nextDueBill && (
                <p className="text-sm text-red-500 mt-2 font-medium">
                Next Due: {new Date(nextDueBill.dueDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            )}
            
            {outstandingBalance > 0 && nextDueBill && (
                <div className="mt-4">
                    <PayFeeButton 
                        studentId={studentProfile.id}
                        feeRecordId={nextDueBill.id}
                        amount={nextDueBill.amount - nextDueBill.amountPaid}
                        studentName={studentProfile.name}
                        email={studentProfile.email || ""} 
                        mobile={studentProfile.mobile || ""}
                    />
                </div>
            )}
          </CardContent>
        </Card>

        {/* --- SUMMARY CARD --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" /> Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Billed (YTD)</span>
              <span className="font-medium">₹{(totalBilled / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-medium text-green-600">₹{(totalPaid / 100).toLocaleString("en-IN")}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right text-muted-foreground">{progressPercentage}% Paid</p>
          </CardContent>
        </Card>
      </div>

      {/* --- HISTORY TABLE --- */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Record of your recent payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No payments found.
                    </TableCell>
                 </TableRow>
              ) : (
                paymentHistory.map((inv) => (
                    <TableRow key={inv.id}>
                    <TableCell className="font-medium text-gray-600">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{inv.description || "Fee Payment"}</TableCell>
                    <TableCell>₹{(inv.amount / 100).toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                        <span className="text-xs font-mono uppercase text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                            {inv.paymentMode}
                        </span>
                    </TableCell>
                    <TableCell>
                        {inv.status === "PAID" && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">Paid</Badge>}
                        {inv.status === "PENDING" && <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>}
                        {inv.status === "FAILED" && <Badge variant="destructive">Failed</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                        {/* ✅ Integration: Download Receipt Button */}
                        {inv.status === "PAID" && (
                          <DownloadReceiptButton 
                            paymentData={{
                              id: inv.id,
                              amount: inv.amount,
                              date: inv.paidAt,
                              description: inv.description,
                              paymentMode: inv.paymentMode,
                              transactionId: inv.razorpayPaymentId || (inv.paymentMode === "CASH" ? `CASH-${inv.id}` : null)
                            }}
                            studentData={{
                              name: studentProfile.name,
                              grade: studentProfile.grade || "",
                              section: studentProfile.section || "",
                              admissionNo: studentProfile.admissionNo
                            }}
                            schoolSettings={schoolData}
                          />
                        )}
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}