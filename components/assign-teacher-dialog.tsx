"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignTeacherAction } from "@/actions/class-actions";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignTeacherDialogProps {
  classId: number;
  className: string; // e.g. "7-A"
  currentTeacherId?: number | null;
  teachersList: { id: number; name: string }[];
}

export function AssignTeacherDialog({
  classId,
  className,
  currentTeacherId,
  teachersList,
}: AssignTeacherDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>(
    currentTeacherId?.toString() || ""
  );

  async function handleSave() {
    if (!selectedTeacher) return;
    setIsLoading(true);

    const res = await assignTeacherAction({
      classId: classId,
      teacherId: parseInt(selectedTeacher),
    });

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert("Failed to assign teacher");
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <UserPlus className="h-3 w-3 mr-2" />
          {currentTeacherId ? "Change Teacher" : "Assign Teacher"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Class Teacher</DialogTitle>
          <DialogDescription>
            Select the teacher responsible for Class {className}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Teacher</label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a teacher..." />
              </SelectTrigger>
              <SelectContent>
                {teachersList.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedTeacher}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Save Assignment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
