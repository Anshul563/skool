"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react"; // Make sure lucide-react is installed
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  endpoint: "profileImage"; // Matches the key in core.ts
}

export const ImageUpload = ({ value, onChange, endpoint }: ImageUploadProps) => {
  if (value) {
    return (
      <div className="relative h-20 w-20">
        <Image
          fill
          src={value}
          alt="Upload"
          className="rounded-full object-cover"
        />
        <button
          onClick={() => onChange("")}
          className="bg-rose-500 text-white p-1 rounded-full absolute top-0 right-0 shadow-sm"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        onChange(res?.[0].url);
      }}
      onUploadError={(error: Error) => {
        toast.error(`ERROR! ${error.message}`);
      }}
      className="w-full border-dashed border-2 border-gray-300 rounded-lg p-4 ut-label:text-sm ut-button:bg-black ut-button:text-white"
    />
  );
};