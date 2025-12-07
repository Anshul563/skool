"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { students, parents, classes } from "@/src/db/schema"; 
import { headers } from "next/headers";
// 1. ADD 'ilike' (Case Insensitive) and 'and' (for Roll No logic)
import { eq, like, ilike, or, count, and } from "drizzle-orm"; 
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: Generate Random Password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8) + "Aa1!";
};

// 1. Search Action (FIXED: Case Insensitive)
export async function searchParentsAction(query: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  if (!query) return [];

  return await db
    .select()
    .from(parents)
    .where(
      or(
        // Use 'ilike' instead of 'like' so "john" matches "John"
        ilike(parents.name, `%${query}%`),
        ilike(parents.email, `%${query}%`),
        ilike(parents.mobile, `%${query}%`)
      )
    )
    .limit(5);
}

export async function getStudentsByClassAction(grade: string, section: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    const result = await db
        .select()
        .from(students)
        .where(
            and(
                eq(students.grade, grade),
                eq(students.section, section)
            )
        )
        .orderBy(students.name);
        
    return result;
}

// 2. Create Student Action
export async function createStudentAction(data: any) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const {
    studentName,
    studentEmail,
    classId,
    parentMode,
    parentId,
    parentDetails,
    dob,
    mobile,
    address,
    fatherName,
    motherName,
    profileImage,
  } = data;

  try {
    const currentYear = new Date().getFullYear();

    // --- 1. GENERATE ADMISSION NUMBER ---
    const studentCountResult = await db.select({ value: count() }).from(students);
    const nextAdmissionCount = studentCountResult[0].value + 1;
    const admissionNumber = `SKL${currentYear}${String(nextAdmissionCount).padStart(3, "0")}`;

    // --- 2. GENERATE ROLL NUMBER ---
    // Get Grade/Section from the 'classes' table using the dropdown ID
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, parseInt(classId)),
    });

    if (!classData) throw new Error("Invalid Class Selected");

    // FIX: Count students by GRADE + SECTION (Since 'students.classId' was removed)
    const classCountResult = await db
      .select({ value: count() })
      .from(students)
      .where(
        and(
            eq(students.grade, classData.grade),
            eq(students.section, classData.section)
        )
      );

    const nextRollCount = classCountResult[0].value + 1;
    const rollNumber = `SKL${classData.grade}${classData.section}${currentYear}${String(nextRollCount).padStart(2, "0")}`;

    // --- 3. HANDLE PARENT ---
    let finalParentUserId = parentId;
    let parentPassword = "";

    if (parentMode === "new") {
      parentPassword = generatePassword();

      const newParentAuth = await auth.api.createUser({
        body: {
          email: parentDetails.email,
          password: parentPassword,
          name: parentDetails.name,
          role: "parent",
        },
      });

      if (!newParentAuth) throw new Error("Failed to create parent account");
      finalParentUserId = newParentAuth.user.id;

      await db.insert(parents).values({
        userId: finalParentUserId,
        name: parentDetails.name,
        email: parentDetails.email,
        mobile: parentDetails.mobile,
        address: parentDetails.address,
      });

      // SEND EMAIL TO NEW PARENT
      await resend.emails.send({
        from: "Skool Admin <onboarding@resend.dev>", // Change this in production
        to: parentDetails.email,
        subject: "Welcome to Skool - Parent Portal Access",
        html: `
          <h1>Welcome, ${parentDetails.name}!</h1>
          <p>Your parent account has been created.</p>
          <p><strong>Login Email:</strong> ${parentDetails.email}</p>
          <p><strong>Password:</strong> ${parentPassword}</p>
          <a href="${process.env.BETTER_AUTH_URL}/sign-in">Login Here</a>
        `,
      });
    }

    // --- 4. CREATE STUDENT ---
    const studentPassword = generatePassword();
    const newStudentAuth = await auth.api.createUser({
      body: {
        email: studentEmail,
        password: studentPassword,
        name: studentName,
        role: "student",
      },
    });

    if (!newStudentAuth) throw new Error("Failed to create student account");

    // SAVE FULL DATA TO DB
    await db.insert(students).values({
      userId: newStudentAuth.user.id,
      parentId: finalParentUserId,
      name: studentName,
      admissionNumber: admissionNumber,
      rollNumber: rollNumber,
      
      // FIX: Save Grade/Section strings (schema no longer has classId)
      grade: classData.grade, 
      section: classData.section,
      
      dob: new Date(dob), // Ensure Date conversion
      mobile,
      address,
      fatherName,
      motherName,
      profileImage,
    });

    // SEND EMAIL TO STUDENT
    await resend.emails.send({
      from: "Skool Admin <onboarding@resend.dev>",
      to: studentEmail,
      subject: "Welcome to Skool - Admission Details",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>Welcome, ${studentName}!</h1>
          <p>Your admission to <strong>Class ${classData.grade}-${classData.section}</strong> is confirmed.</p>
          
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Official Details</h3>
            <p><strong>Admission No:</strong> ${admissionNumber}</p>
            <p><strong>Roll No:</strong> ${rollNumber}</p>
          </div>

          <div style="background: #e6efff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Login Credentials</h3>
            <p><strong>Email:</strong> ${studentEmail}</p>
            <p><strong>Password:</strong> ${studentPassword}</p>
          </div>

          <p>Please login and change your password immediately.</p>
          <a href="${process.env.BETTER_AUTH_URL}/sign-in" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Portal</a>
        </div>
      `,
    });

    return { success: true, admissionNumber, rollNumber };

  } catch (error: any) {
    console.error("Create Student Error:", error);
    const errorMessage = error.body?.message || error.message || "Failed to create student";
    return { success: false, error: errorMessage };
  }
}

export async function searchStudentsAction(query: string) {
  // 1. Security Check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (!query || query.length < 2) {
    return { success: true, data: [] }; // Return empty if query is too short
  }

  try {
    // 2. Perform Search
    // We search across Name AND Admission Number
    const searchResults = await db
      .select({
        id: students.id,
        name: students.name,
        admissionNumber: students.admissionNumber,
        grade: students.grade,
        section: students.section,
        // Optional: Add parent info if needed
      })
      .from(students)
      .where(
        or(
          ilike(students.name, `%${query}%`), // Partial match on Name
          ilike(students.admissionNumber, `%${query}%`) // Partial match on Admission No
        )
      )
      .limit(10); // Limit results to keep UI snappy

    return { success: true, data: searchResults };

  } catch (error) {
    console.error("Search Student Error:", error);
    return { success: false, error: "Failed to search students." };
  }
}