"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
// Ensure this path matches where you created the PDF component earlier
import { FeeReceiptPdf } from "@/components/fee-receipt"; 
import { toast } from "sonner";

// Props passed from the Server Component
interface DownloadReceiptButtonProps {
  paymentData: {
    id: number;
    amount: number;
    date: Date | null;
    description: string | null;
    paymentMode: string;
    transactionId: string | null;
  };
  studentData: {
    name: string;
    grade: string;
    section: string;
    admissionNo?: string | null;
  };
  // This object comes from the parent page, NOT the DB schema import
  schoolSettings: {
    schoolName: string;
    schoolAddress: string;
    schoolPhone?: string | null;
    schoolEmail?: string | null;
  };
}

export function DownloadReceiptButton({ 
  paymentData, 
  studentData, 
  schoolSettings // ✅ 1. Destructure this from props
}: DownloadReceiptButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // 2. Generate the PDF Blob
      const blob = await pdf(
        <FeeReceiptPdf 
          receiptNo={`RCPT-${paymentData.id}`}
          date={paymentData.date ? new Date(paymentData.date).toLocaleDateString() : new Date().toLocaleDateString()}
          studentName={studentData.name}
          classDetails={`${studentData.grade}-${studentData.section}`}
          admissionNo={studentData.admissionNo || ""}
          description={paymentData.description || "Fee Payment"}
          amount={paymentData.amount}
          paymentMode={paymentData.paymentMode}
          transactionId={paymentData.transactionId || ""}
          schoolSettings={schoolSettings} // ✅ 3. Pass the prop object directly
        />
      ).toBlob();

      // 3. Trigger Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Receipt-${paymentData.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("PDF Generation Error", error);
      toast.error("Failed to generate receipt");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDownload} disabled={isGenerating} title="Download Receipt">
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      ) : (
        <Download className="h-4 w-4 text-gray-500" />
      )}
    </Button>
  );
}