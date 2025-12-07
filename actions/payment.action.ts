"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { feeRecords, payments, students } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --- ACTION 1: CREATE ORDER ---
export async function createFeeOrder(feeRecordId: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    // 1. Fetch Fee Record
    const feeRecord = await db.query.feeRecords.findFirst({
      where: eq(feeRecords.id, feeRecordId),
      with: { student: true } // Need student details?
    });

    if (!feeRecord) return { success: false, error: "Fee record not found" };
    
    // Calculate remaining amount (Total - Paid)
    const amountToPay = feeRecord.amount - feeRecord.amountPaid;

    if (amountToPay <= 0) {
      return { success: false, error: "Fee already paid" };
    }

    // 2. Create Razorpay Order
    // Amount must be in lowest currency unit (Paise for INR)
    // Your DB stores in Paise/Cents, so pass directly.
    const options = {
      amount: amountToPay, 
      currency: "INR",
      receipt: `fee_rcpt_${feeRecordId}`,
      notes: {
        studentId: feeRecord.studentId,
        feeRecordId: feeRecordId,
      },
    };

    const order = await razorpay.orders.create(options);

    return { success: true, orderId: order.id, amount: amountToPay };

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return { success: false, error: "Failed to initiate payment" };
  }
}

// --- ACTION 2: VERIFY PAYMENT ---
export async function verifyFeePayment(data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  feeRecordId: number;
  studentId: number;
  amount: number;
}) {
  try {
    // 1. Verify Signature (Security Check)
    const body = data.razorpayOrderId + "|" + data.razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== data.razorpaySignature) {
      return { success: false, error: "Invalid Payment Signature" };
    }

    // 2. Record Payment in Database
    await db.insert(payments).values({
      studentId: data.studentId,
      feeRecordId: data.feeRecordId,
      amount: data.amount,
      currency: "INR",
      status: "PAID",
      paymentMode: "ONLINE",
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      description: "Online Fee Payment",
      paidAt: new Date(),
    });

    // 3. Update Fee Record
    // We assume full payment of the remaining amount for online transactions usually
    // But let's verify current status first
    const currentFee = await db.query.feeRecords.findFirst({
        where: eq(feeRecords.id, data.feeRecordId)
    });

    if(currentFee) {
        const newPaidTotal = currentFee.amountPaid + data.amount;
        const newStatus = newPaidTotal >= currentFee.amount ? "PAID" : "PARTIALLY_PAID";

        await db.update(feeRecords)
            .set({ 
                amountPaid: newPaidTotal, 
                status: newStatus 
            })
            .where(eq(feeRecords.id, data.feeRecordId));
    }

    return { success: true };

  } catch (error) {
    console.error("Verification Error:", error);
    return { success: false, error: "Payment verification failed" };
  }
}