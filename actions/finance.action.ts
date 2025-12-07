"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db"; // Ensure this path matches your project
import { feeStructure, feeRecords, students, payments, classes } from "@/src/db/schema"; // Ensure this path matches
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- 1. SET FEE STRUCTURE ---
export async function setClassFee(classId: number, amount: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    // Upsert logic (Insert or Update)
    await db.insert(feeStructure)
      .values({ classId, monthlyAmount: amount * 100 }) // Store as cents/paise
      .onConflictDoUpdate({
        target: feeStructure.classId,
        set: { monthlyAmount: amount * 100, updatedAt: new Date() },
      });

    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error) {
    console.error("Set Fee Error:", error);
    return { success: false, error: "Failed to set fee" };
  }
}

// --- 2. GENERATE MONTHLY FEES (The Automation Logic) ---
export async function generateMonthlyFees() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const dueDate = new Date(currentYear, currentMonth - 1, 20); // Due on 20th

    // 1. Get students linked to their Fee Structure
    // Since Students don't have classId, we join: Students -> Classes -> FeeStructure
    const activeStudents = await db
      .select({
        studentId: students.id,
        classId: classes.id, // We get the actual Class ID from the joined table
        feeAmount: feeStructure.monthlyAmount,
      })
      .from(students)
      .innerJoin(
        classes, 
        and(
          eq(students.grade, classes.grade), 
          eq(students.section, classes.section)
        )
      )
      .innerJoin(
        feeStructure, 
        eq(classes.id, feeStructure.classId)
      );

    if (!activeStudents.length) return { success: false, error: "No eligible students found." };

    let createdCount = 0;
    
    // 2. Loop through students and create fee records
    for (const student of activeStudents) {
      // Check if a fee record already exists for this student for this month
      const existing = await db.query.feeRecords.findFirst({
        where: and(
          eq(feeRecords.studentId, student.studentId),
          eq(feeRecords.month, currentMonth),
          eq(feeRecords.year, currentYear)
        )
      });

      if (!existing && student.feeAmount > 0) {
        await db.insert(feeRecords).values({
          studentId: student.studentId,
          classId: student.classId, // Using the ID from the classes join
          month: currentMonth,
          year: currentYear,
          amount: student.feeAmount,
          dueDate: dueDate,
          status: "PENDING",
        });
        createdCount++;
      }
    }

    revalidatePath("/admin/finance");
    return { success: true, message: `Generated fees for ${createdCount} students.` };
  } catch (error) {
    console.error("Fee Generation Error:", error);
    return { success: false, error: "Failed to generate fees" };
  }
}

// --- 3. RECORD CASH PAYMENT ---
const cashPaymentSchema = z.object({
  studentId: z.coerce.number(),
  amount: z.coerce.number().min(1),
});

export async function recordCashPayment(data: z.infer<typeof cashPaymentSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return { success: false, error: "Unauthorized" };

  try {
    const { studentId, amount } = cashPaymentSchema.parse(data);
    const amountInPaise = amount * 100;

    // 1. Find the oldest PENDING fee record for this student
    const pendingFee = await db.query.feeRecords.findFirst({
      where: and(
        eq(feeRecords.studentId, studentId),
        sql`${feeRecords.status} != 'PAID'`
      ),
      orderBy: (fees, { asc }) => [asc(fees.year), asc(fees.month)], // Pay oldest dues first
    });

    if (!pendingFee) {
      return { success: false, error: "No pending fees found for this student." };
    }

    // 2. Create Payment Record
    await db.insert(payments).values({
      studentId,
      amount: amountInPaise,
      currency: "INR",
      status: "PAID",
      description: `Cash Payment for ${pendingFee.month}/${pendingFee.year}`,
      paymentMode: "CASH", 
      feeRecordId: pendingFee.id, 
      paidAt: new Date(),
    });

    // 3. Update Fee Record Status
    const newPaidAmount = pendingFee.amountPaid + amountInPaise;
    let newStatus: "PAID" | "PARTIALLY_PAID" | "PENDING" = "PENDING";

    if (newPaidAmount >= pendingFee.amount) newStatus = "PAID";
    else if (newPaidAmount > 0) newStatus = "PARTIALLY_PAID";

    await db.update(feeRecords)
      .set({ 
        amountPaid: newPaidAmount,
        status: newStatus 
      })
      .where(eq(feeRecords.id, pendingFee.id));

    // 4. Send Email (Mock function)
    // await sendPaymentReceiptEmail(studentId, amount, "CASH");

    revalidatePath("/admin/finance");
    return { success: true, message: "Cash payment recorded successfully!" };

  } catch (error) {
    console.error("Payment Error:", error);
    return { success: false, error: "Failed to record payment" };
  }
}