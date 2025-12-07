"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X, Loader2, Clock, CalendarDays } from "lucide-react";
import { createTimetable } from "@/actions/timetable.action";

// --- Shadcn Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// --- Types ---
type ClassItem = { id: number; grade: string; section: string };
type SubjectItem = { id: number; name: string; code: string | null };
type TeacherItem = { id: number; name: string };

interface CreateTimetableModalProps {
  classes: ClassItem[];
  subjects: SubjectItem[];
  teachers: TeacherItem[];
}

// --- 1. Update Schema to include 'day' ---
const timetableSchema = z.object({
  classId: z.string().min(1, "Please select a class"),
  day: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]), // ✅ Added Day
  periods: z.array(
    z.object({
      subjectId: z.string().min(1, "Subject is required"),
      teacherId: z.string().min(1, "Teacher is required"),
      startTime: z.string().min(1, "Required"),
      endTime: z.string().min(1, "Required"),
    })
    .refine((data) => data.endTime > data.startTime, {
        message: "End time must be after start time",
        path: ["endTime"],
    })
  ).min(1, "At least one period is required"),
});

type TimetableFormValues = z.infer<typeof timetableSchema>;

export function CreateTimetableModal({ classes, subjects, teachers }: CreateTimetableModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
      classId: "",
      day: "MONDAY", // ✅ Default Value
      periods: [{ subjectId: "", teacherId: "", startTime: "", endTime: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "periods",
  });

  const handleClose = () => {
    setIsOpen(false);
    form.reset();
  };

  const onSubmit: SubmitHandler<TimetableFormValues> = async (data) => {
    try {
      setIsSubmitting(true);
      
      const payload = {
        classId: Number(data.classId),
        day: data.day, // ✅ Send the selected day
        periods: data.periods.map((p) => ({
          subjectId: Number(p.subjectId),
          teacherId: Number(p.teacherId),
          startTime: p.startTime,
          endTime: p.endTime,
        })),
      };

      const result = await createTimetable(payload);

      if (!result.success) {
        throw new Error(result.error || "Failed");
      }

      toast.success(`Timetable for ${data.day} created successfully!`);
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Create Timetable
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Create Class Timetable</h2>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            <div className="overflow-y-auto p-6">
              <Form {...form}>
                <form id="timetable-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  
                  {/* Top Row: Class + Day Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    
                    {/* Class Select */}
                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="-- Select Class --" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.grade} - {c.section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ✅ Day Select */}
                    <FormField
                      control={form.control}
                      name="day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of the Week</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                                    <SelectValue placeholder="Select Day" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => (
                                <SelectItem key={day} value={day}>
                                  {day.charAt(0) + day.slice(1).toLowerCase()} {/* "MONDAY" -> "Monday" */}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Periods Section (Same as before) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Clock size={16}/> Periods
                      </h3>
                    </div>

                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-end relative">
                        <div className="absolute -left-2 top-4 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border shadow-sm z-10">
                          {index + 1}
                        </div>

                        {/* Subject */}
                        <div className="md:col-span-4">
                          <FormField
                            control={form.control}
                            name={`periods.${index}.subjectId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Subject</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Subject" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {subjects.map((s) => (
                                      <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name} ({s.code})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Teacher */}
                        <div className="md:col-span-4">
                          <FormField
                            control={form.control}
                            name={`periods.${index}.teacherId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Teacher</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Teacher" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {teachers.map((t) => (
                                      <SelectItem key={t.id} value={String(t.id)}>
                                        {t.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Time */}
                        <div className="md:col-span-3 grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`periods.${index}.startTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Start</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`periods.${index}.endTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">End</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Delete */}
                        <div className="md:col-span-1 flex justify-end pb-2">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => remove(index)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => append({ subjectId: "", teacherId: "", startTime: "", endTime: "" })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Period
                  </Button>
                </form>
              </Form>
            </div>

            <div className="p-6 border-t bg-muted/20 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button form="timetable-form" type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}