"use server";

import { auth } from "@/lib/auth"; // Your backend auth config
import { db } from "@/lib/db";
import { teachers } from "@/src/db/schema";
import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to generate random password
function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function createTeacherAction(data: any) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Security: Only Admins can do this
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const { name, email, qualification, experience, subject, mobile, profileImage } = data;
  const tempPassword = generatePassword();

  try {
    // 1. Create Auth User (Better Auth)
    const newUser = await auth.api.createUser({
      body: {
        email,
        password: tempPassword,
        name,
        role: "teacher", // IMPORTANT: Sets their role
      },
    });

    if (!newUser) {
      return { success: false, error: "Failed to create user account" };
    }

    // 2. Create Teacher Profile (Drizzle)
    await db.insert(teachers).values({
      userId: newUser.user.id,
      name,
      email: email, // Optional: duplicate email in profile for easier querying
      qualification,
      experienceYears: parseInt(experience),
      subjectSpecialization: subject,
      mobile,
      profileImage, // URL from UploadThing
    });

    // 3. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "Skool Admin <onboarding@resend.dev>", // Use your domain in prod
          to: email,
          subject: "Welcome to Skool - Your Teacher Account",
          html: `
            <h1>Welcome, ${name}!</h1>
            <p>Your account has been created.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please log in and change your password immediately.</p>
            <a href="${process.env.BETTER_AUTH_URL}/sign-in">Login Here</a>
          `,
        });
    } else {
        // Fallback for dev mode without API key
        console.log("--------------------------------");
        console.log(`📧 EMAIL SIMULATION for ${email}`);
        console.log(`🔑 PASSWORD: ${tempPassword}`);
        console.log("--------------------------------");
    }

    return { success: true };

  } catch (error: any) {
    console.error("Create Teacher Error:", error);
    // Better Auth error handling (e.g. email already exists)
    if (error.body?.message) {
        return { success: false, error: error.body.message };
    }
    return { success: false, error: "Something went wrong" };
  }
}