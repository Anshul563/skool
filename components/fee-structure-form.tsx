"use client";
import { useState } from "react";
import { setClassFee } from "@/actions/finance.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";

export function FeeStructureForm({ classId, className, currentAmount }: any) {
  const [amount, setAmount] = useState(currentAmount);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await setClassFee(classId, Number(amount));
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
      <div className="flex items-center gap-4">
        <div className="w-24 font-semibold">Class {className}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">₹</span>
          <Input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="w-32 h-8"
          />
          <span className="text-xs text-gray-400">/ month</span>
        </div>
      </div>
      <Button size="sm" onClick={handleSave} disabled={loading || amount == currentAmount}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      </Button>
    </div>
  );
}