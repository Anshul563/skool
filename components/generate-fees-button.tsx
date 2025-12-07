"use client";

import { useState } from "react";
import { generateMonthlyFees } from "@/actions/finance.action";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function GenerateFeesButton() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    // 1. Confirm Intent (Critical for bulk operations)
    const confirmed = window.confirm(
      "Are you sure you want to generate fees for the current month?\n\nThis will create a 'Pending' fee record for every student based on their class fee structure."
    );

    if (!confirmed) return;

    // 2. Trigger Action
    setIsGenerating(true);
    try {
      const res = await generateMonthlyFees();

      if (res.success) {
        toast.success(res.message); // e.g. "Generated fees for 150 students."
      } else {
        toast.error(res.error || "Failed to generate fees.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred while generating fees.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      variant="default" // Using primary style to make it prominent
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate Monthly Fees
        </>
      )}
    </Button>
  );
}