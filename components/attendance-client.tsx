"use client";

import { useState, useEffect } from "react";
import { getStudentsByClassAction } from "@/actions/student-actions";
import { saveAttendanceAction } from "@/actions/attendance-actions"; // Import the save action
import { Loader2, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; 

interface AttendanceClientProps {
  // Real classes passed from the server
  availableClasses: { id: number; grade: string; section: string }[]; 
}

export function AttendanceClient({ availableClasses }: AttendanceClientProps) {
  const [selectedClassId, setSelectedClassId] = useState(""); // Storing numeric ID as string
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<number, boolean>>({});

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
        setLoading(true);
        
        // Find the selected class object to get grade/section strings
        const cls = availableClasses.find(c => c.id.toString() === selectedClassId);
        if (!cls) return;

        const data = await getStudentsByClassAction(cls.grade, cls.section);
        
        setStudentsList(data);
        
        // Initialize all as Present (true)
        const initialAttendance: Record<number, boolean> = {};
        data.forEach(s => initialAttendance[s.id] = true);
        setAttendanceData(initialAttendance);
        
        setLoading(false);
    };

    fetchStudents();
  }, [selectedClassId, availableClasses]);

  const toggleAttendance = (id: number) => {
    setAttendanceData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const submitAttendance = async () => {
    setSubmitting(true);
    
    // Prepare data for server action
    const records = Object.entries(attendanceData).map(([studentId, isPresent]) => ({
        studentId: parseInt(studentId),
        isPresent,
    }));

    const result = await saveAttendanceAction({
        classId: parseInt(selectedClassId),
        date: new Date(),
        records: records
    });

    if (result.success) {
        toast.success("Attendance Saved Successfully!"); // Or toast.success()
        // Optional: Reset or redirect
    } else {
        toast.error("Error saving attendance");
    }
    setSubmitting(false);
  };

  const selectedClassDetails = availableClasses.find(c => c.id.toString() === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Mark Attendance</h1>
            <p className="text-muted-foreground">Select a class to take roll call.</p>
        </div>
        <div className="w-full md:w-64">
            <Select onValueChange={setSelectedClassId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                    {availableClasses.map(cls => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                            Class {cls.grade}-{cls.section}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      {!selectedClassId ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-gray-50 text-gray-400">
            <UserCheck className="h-10 w-10 mb-2" />
            <p>Please select a class to begin.</p>
        </div>
      ) : (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                    Students in {selectedClassDetails?.grade}-{selectedClassDetails?.section}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({new Date().toLocaleDateString()})
                    </span>
                </CardTitle>
                <div className="text-sm font-medium">
                    Present: <span className="text-green-600">{Object.values(attendanceData).filter(Boolean).length}</span> / {studentsList.length}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
                ) : studentsList.length === 0 ? (
                     <div className="text-center py-8 text-gray-500">No students found in this class.</div>
                ) : (
                    <div className="space-y-4">
                        {studentsList.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={student.profileImage || ""} />
                                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">Roll: {student.rollNumber || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold w-16 text-center ${attendanceData[student.id] ? "text-green-600" : "text-red-600"}`}>
                                        {attendanceData[student.id] ? "PRESENT" : "ABSENT"}
                                    </span>
                                    <Switch 
                                        checked={attendanceData[student.id]} 
                                        onCheckedChange={() => toggleAttendance(student.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 pt-4 border-t flex justify-end">
                    <Button onClick={submitAttendance} size="lg" disabled={loading || submitting || studentsList.length === 0}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Attendance
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}