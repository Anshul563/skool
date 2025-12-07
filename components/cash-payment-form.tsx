"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { recordCashPayment } from "@/actions/finance.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, CheckCircle } from "lucide-react";
// You need a server action to search students, let's mock it for now or implement a simple one
import { searchStudentsAction } from "@/actions/student-actions"; 

export function CashPaymentForm() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  const handleSearch = async () => {
    // Call server action to search
    const res = await searchStudentsAction(query); 
    if(res.success) setStudents(res.data);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedStudent) return;
    
    setIsPaying(true);
    const form = e.target as HTMLFormElement;
    const amount = form.amount.value;

    const res = await recordCashPayment({ 
      studentId: selectedStudent.id, 
      amount: Number(amount) 
    });

    if (res.success) {
      alert("Payment Recorded!");
      setSelectedStudent(null);
      setStudents([]);
      setQuery("");
    } else {
      alert(res.error);
    }
    setIsPaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Step */}
      {!selectedStudent && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Search by name or admission no..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button onClick={handleSearch}><Search size={16} /></Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {students.map((s) => (
              <div 
                key={s.id} 
                className="p-3 border rounded cursor-pointer hover:bg-slate-50 flex justify-between"
                onClick={() => setSelectedStudent(s)}
              >
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Class: {s.grade}-{s.section}</p>
                </div>
                <Button variant="outline" size="sm">Select</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Step */}
      {selectedStudent && (
        <form onSubmit={handlePayment} className="space-y-4 animate-in fade-in">
          <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Paying for</p>
              <p className="font-bold text-lg">{selectedStudent.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>Change</Button>
          </div>

          <div className="space-y-2">
            <Label>Amount Received (₹)</Label>
            <Input name="amount" type="number" placeholder="Enter amount" required min={1} />
          </div>

          <Button type="submit" className="w-full" disabled={isPaying}>
            {isPaying ? <Loader2 className="animate-spin" /> : "Confirm Cash Payment"}
          </Button>
        </form>
      )}
    </div>
  );
}