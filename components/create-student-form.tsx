"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createStudentAction,
  searchParentsAction,
} from "@/actions/student-actions";
import { Loader2, User, Check } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Import Label for consistent UI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// 1. Schema
const studentSchema = z.object({
  profileImage: z.string().optional(),
  studentName: z.string().min(2, "Name is required"),
  studentEmail: z.string().email("Invalid email"),
  dob: z.string().min(1, "Date of Birth is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  classId: z.string().min(1, "Please select a class"),
});

// 2. Props
interface CreateStudentFormProps {
  availableClasses: {
    id: number;
    grade: string;
    section: string;
    capacity: number;
    studentCount: number;
  }[];
}

export function CreateStudentForm({
  availableClasses,
}: CreateStudentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Parent Account State
  const [parentMode, setParentMode] = useState<"new" | "existing">("new");
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [newParentData, setNewParentData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      studentName: "",
      studentEmail: "",
      mobile: "",
      address: "",
      fatherName: "",
      motherName: "",
      dob: "",
      classId: "",
      profileImage: "",
    },
  });

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    const results = await searchParentsAction(query);
    setSearchResults(results);
  };

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    // Validate Parent Selection manually since it's outside the form schema
    if (parentMode === "existing" && !selectedParent)
      return toast.warning("Please select an existing parent account from the list.");

    if (parentMode === "new" && (!newParentData.name || !newParentData.email))
      return toast.warning("Please fill in the new parent details.");

    setIsLoading(true);

    const payload = {
      ...values,
      parentMode,
      parentId: selectedParent?.userId,
      parentDetails: newParentData,
    };

    const res = await createStudentAction(payload);

    if (res.success) {
      toast.success("Student Created Successfully!", {
        description: `Admission No: ${res.admissionNumber}`,
      });
      router.push("/admin/students");
      router.refresh();
    } else {
      toast.error(res.error);
    }
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* --- SECTION 1: Personal Details --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Student Profile
          </h3>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Upload Column */}
            <div className="flex flex-col items-center space-y-2">
              <FormLabel>Profile Photo</FormLabel>
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        endpoint="profileImage"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inputs Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <Input placeholder="John Doe" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input type="date" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's Name</FormLabel>
                    <Input placeholder="Robert Doe" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother's Name</FormLabel>
                    <Input placeholder="Mary Doe" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <Input placeholder="+1 234 567 890" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Email (Student)</FormLabel>
                    <Input placeholder="student@skool.com" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Residential Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Main St, City..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- SECTION 2: Academic Details --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Academic Info
          </h3>

          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Assign Class</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableClasses.map((cls) => {
                      const isFull = cls.studentCount >= cls.capacity;
                      const seatsLeft = cls.capacity - cls.studentCount;

                      return (
                        <SelectItem
                          key={cls.id}
                          value={cls.id.toString()}
                          disabled={isFull}
                          className="flex justify-between w-full"
                        >
                          <span>
                            Class {cls.grade}-{cls.section}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {isFull ? "(Full)" : `(${seatsLeft} seats left)`}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Admission Number & Roll Number will be auto-generated.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- SECTION 3: Parent Account --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Parent Account
          </h3>
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-medium">Link Guardian Account</h4>
                <p className="text-sm text-muted-foreground">
                  This account will have access to pay fees and view reports.
                </p>
              </div>

              <Dialog
                open={isParentModalOpen}
                onOpenChange={setIsParentModalOpen}
              >
                <DialogTrigger asChild>
                  {/* IMPORTANT: type="button" prevents submitting the main form */}
                  <Button variant="outline" type="button">
                    {selectedParent || newParentData.name
                      ? "Change Selection"
                      : "Select Parent"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Parent Selection</DialogTitle>
                  </DialogHeader>
                  <Tabs
                    defaultValue="new"
                    onValueChange={(v: any) => setParentMode(v)}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="new">New Account</TabsTrigger>
                      <TabsTrigger value="existing">
                        Existing Account
                      </TabsTrigger>
                    </TabsList>

                    {/* NEW PARENT FORM */}
                    <TabsContent value="new" className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Parent Full Name</Label>
                        <Input
                          placeholder="Parent Full Name"
                          value={newParentData.name}
                          onChange={(e) =>
                            setNewParentData({
                              ...newParentData,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                          placeholder="Email Address"
                          value={newParentData.email}
                          onChange={(e) =>
                            setNewParentData({
                              ...newParentData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mobile Number</Label>
                        <Input
                          placeholder="Mobile Number"
                          value={newParentData.mobile}
                          onChange={(e) =>
                            setNewParentData({
                              ...newParentData,
                              mobile: e.target.value,
                            })
                          }
                        />
                      </div>
                      {/* IMPORTANT: type="button" */}
                      <Button
                        type="button"
                        onClick={() => setIsParentModalOpen(false)}
                        className="w-full"
                      >
                        Confirm Details
                      </Button>
                    </TabsContent>

                    {/* EXISTING PARENT SEARCH */}
                    <TabsContent value="existing" className="py-4">
                      <Command className="border rounded-md">
                        <CommandInput
                          placeholder="Search name, email..."
                          onValueChange={handleSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No parents found</CommandEmpty>
                          <CommandGroup>
                            {searchResults.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.email} // Mandatory for Shadcn Command to work right
                                onSelect={() => {
                                  setSelectedParent(p);
                                  setIsParentModalOpen(false);
                                }}
                              >
                                <User className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                  <span>{p.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {p.email}
                                  </span>
                                </div>
                                {selectedParent?.id === p.id && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>

            {/* Selection Summary */}
            <div className="p-3 bg-white border rounded-md">
              {parentMode === "new" && newParentData.name ? (
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    NEW
                  </div>
                  <div>
                    <p className="font-medium">{newParentData.name}</p>
                    <p className="text-xs text-gray-500">
                      {newParentData.email}
                    </p>
                  </div>
                </div>
              ) : parentMode === "existing" && selectedParent ? (
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                    LINKED
                  </div>
                  <div>
                    <p className="font-medium">{selectedParent.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedParent.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No parent account selected yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Complete Student Admission"
          )}
        </Button>
      </form>
    </Form>
  );
}
