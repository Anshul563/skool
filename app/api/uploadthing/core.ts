import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth"; // Import your auth instance
import { headers } from "next/headers"; // To get request headers

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define a route for "profileImage"
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    // Middleware to run before upload
    .middleware(async ({ req }) => {
      // 1. Fetch the user's session using Better Auth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      // 2. If no user is logged in, throw an error
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      // 3. Return the user ID (this will be available in onUploadComplete)
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      // Return data to the client-side onClientUploadComplete callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;