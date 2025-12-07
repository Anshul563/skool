"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClassAction } from "@/actions/class-actions";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// Schema for the Grade selection
const formSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
});

export function CreateClassForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Custom State for Sections (A, B, C...)
  // Starts with just one section "A"
  const [sections, setSections] = useState<
    { name: string; capacity: string }[]
  >([{ name: "A", capacity: "" }]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { grade: "" },
  });

  // LOGIC: Add Section (Auto-increment A -> B -> C)
  const addSection = () => {
    const nextChar = String.fromCharCode(65 + sections.length); // 65 is 'A'
    setSections([...sections, { name: nextChar, capacity: "" }]);
  };

  // LOGIC: Remove Section
  const removeSection = (index: number) => {
    if (sections.length === 1) return; // Don't delete the last one
    const newSections = sections.filter((_, i) => i !== index);

    // Optional: Re-calculate names (A, B, C) if you want to fill gaps
    // For now, we just remove it.
    setSections(newSections);
  };

  // LOGIC: Update Capacity for a specific row
  const updateCapacity = (index: number, value: string) => {
    const newSections = [...sections];
    newSections[index].capacity = value;
    setSections(newSections);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate Sections
    const invalidSection = sections.find(
      (s) => !s.capacity || parseInt(s.capacity) <= 0
    );
    if (invalidSection) {
      toast.warning(`Please enter valid capacity for Section ${invalidSection.name}`);
      return;
    }

    setIsLoading(true);

    const payload = {
      grade: values.grade,
      sections: sections.map((s) => ({
        sectionName: s.name,
        capacity: parseInt(s.capacity),
      })),
    };

    const res = await createClassAction(payload);

    if (res.success) {
      toast.success("Classes created successfully!");
      router.refresh();
      // Reset form
      form.reset();
      setSections([{ name: "A", capacity: "" }]);
    } else {
      toast.error("Error creating classes");
    }

    setIsLoading(false);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Classroom</CardTitle>
        <CardDescription>Configure grade levels and sections.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Grade Dropdown */}
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Grade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade (1st - 12th)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                            {num === 1
                              ? "st"
                              : num === 2
                              ? "nd"
                              : num === 3
                              ? "rd"
                              : "th"}{" "}
                            Standard
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Dynamic Sections List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Sections & Capacity</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  className="text-blue-600"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Section
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 mb-2">
                <span>Section Name</span>
                <span>Total Seats</span>
              </div>

              {sections.map((section, index) => (
                <div key={section.name} className="flex gap-4 items-center">
                  {/* Read Only Section Name (A, B, C) */}
                  <div className="w-20 h-10 flex items-center justify-center  rounded-md font-bold border">
                    {section.name}
                  </div>

                  {/* Capacity Input */}
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    value={section.capacity}
                    onChange={(e) => updateCapacity(index, e.target.value)}
                  />

                  {/* Delete Button (only if > 1 section) */}
                  {sections.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeSection(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Class Configuration"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
