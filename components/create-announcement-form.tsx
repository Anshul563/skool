"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createAnnouncementAction } from "@/actions/announcement-actions";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, ImageIcon, Type } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const formSchema = z
  .object({
    title: z.string().min(3, "Title is required"),
    content: z.string().min(5, "Content is required"),
    audience: z.enum(["ALL", "STUDENT", "TEACHER"]),
    type: z.enum(["TEXT", "IMAGE"]),
    imageUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "IMAGE" && !data.imageUrl) return false;
      return true;
    },
    {
      message: "Image is required for Image type announcements",
      path: ["imageUrl"],
    }
  );

export function CreateAnnouncementForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      audience: "ALL",
      type: "TEXT",
      imageUrl: "",
    },
  });

  // Watch the type to conditionally render fields
  const announcementType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const res = await createAnnouncementAction(values);

    if (res.success) {
      form.reset();
      router.refresh();
      toast.success("Announcement Posted!");
    } else {
      toast.error("Error: " + res.error);
    }
    setIsLoading(false);
  }

  return (
    <div className="bg-background p-6 border rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Megaphone className="h-5 w-5 text-blue-600" />
        <h2 className="font-bold text-lg">Create New Announcement</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 1. Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title / Headline</FormLabel>
                <Input placeholder="e.g. School Closed Tomorrow" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 2. Audience Selection */}
          <FormField
            control={form.control}
            name="audience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Audience</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Audience" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ALL">Everyone (School Wide)</SelectItem>
                    <SelectItem value="TEACHER">Teachers Only</SelectItem>
                    <SelectItem value="STUDENT">Students Only</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 3. Type Selection (Text vs Image) */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Announcement Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0 border p-3 rounded-md cursor-pointer hover:bg-gray-50">
                      <FormControl>
                        <RadioGroupItem value="TEXT" />
                      </FormControl>
                      <div className="flex items-center gap-2 font-normal">
                        <Type className="h-4 w-4 text-gray-500" /> Text Only
                      </div>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0 border p-3 rounded-md cursor-pointer hover:bg-gray-50">
                      <FormControl>
                        <RadioGroupItem value="IMAGE" />
                      </FormControl>
                      <div className="flex items-center gap-2 font-normal">
                        <ImageIcon className="h-4 w-4 text-gray-500" /> With
                        Image
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 4. Conditional Image Upload */}
          {announcementType === "IMAGE" && (
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Banner / Flyer</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      endpoint="profileImage" // You can create a generic 'imageUploader' endpoint too
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 5. Content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description / Message</FormLabel>
                <Textarea
                  placeholder="Enter the detailed announcement here..."
                  className="h-32"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Post Announcement"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
