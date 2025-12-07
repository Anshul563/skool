"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { createFeeOrder, verifyFeePayment } from "@/actions/payment.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Load Razorpay Script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PayFeeButtonProps {
  studentId: number;
  feeRecordId: number;
  amount: number; // In Paise
  studentName: string;
  email: string;
  mobile: string;
}

export function PayFeeButton({ 
  studentId, 
  feeRecordId, 
  studentName, 
  email, 
  mobile 
}: PayFeeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Load Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.warning("Failed to load payment gateway. Check internet connection.");
        setLoading(false);
        return;
      }

      // 2. Create Order on Server
      const orderRes = await createFeeOrder(feeRecordId);
      
      if (!orderRes.success || !orderRes.orderId) {
        toast.error(orderRes.error || "Failed to create order");
        setLoading(false);
        return;
      }

      // 3. Open Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderRes.amount,
        currency: "INR",
        name: "School ERP",
        description: "Monthly Fee Payment",
        order_id: orderRes.orderId,
        handler: async function (response: any) {
          // 4. Verify Payment on Server
          const verifyRes = await verifyFeePayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            feeRecordId: feeRecordId,
            studentId: studentId,
            amount: orderRes.amount!,
          });

          if (verifyRes.success) {
            toast.success("Payment Successful!");
            router.refresh(); // Reload page to update UI
          } else {
            toast.error("Payment Verification Failed: " + verifyRes.error);
          }
        },
        prefill: {
          name: studentName,
          email: email,
          contact: mobile,
        },
        theme: {
          color: "#2563EB", // Blue-600
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
      // Handle modal close by user
      paymentObject.on("payment.failed", function (response: any) {
        toast.error("Payment Failed: " + response.error.description);
      });

    } catch (error) {
      console.error(error);
      toast.warning("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="mr-2 h-4 w-4" />
      )}
      Pay Online
    </Button>
  );
}