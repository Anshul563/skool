import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  serial,
  date,
  pgEnum,
  time,
} from "drizzle-orm/pg-core";

// --- AUTH TABLES ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// --- SCHOOL MANAGEMENT TABLES ---

export const dayEnum = pgEnum("day", [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const teachers = pgTable("teacher", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  profileImage: text("profile_image"),
  qualification: text("qualification"),
  experienceYears: integer("experience_years"),
  subjectSpecialization: text("subject_specialization"),
  mobile: text("mobile"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const students = pgTable("student", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  parentId: text("parent_id").references(() => user.id),
  name: text("name").notNull(),
  admissionNumber: text("admission_number").unique(),
  rollNumber: text("roll_number").unique(),
  mobile: text("mobile"),
  grade: text("grade"),
  section: text("section"),
  dob: timestamp("dob"),
  address: text("address"),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const parents = pgTable("parent", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  capacity: integer("capacity").notNull(),
  classTeacherId: integer("class_teacher_id").references(() => teachers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ✅ NEW: The Lessons (Timetable) Table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  name: text("name"), // Optional label
  day: dayEnum("day").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  
  // Relations
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  audience: text("audience").notNull(),
  type: text("type").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  date: date("date").notNull(),
  isPresent: boolean("is_present").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- DRIZZLE RELATIONS (Required for Queries) ---

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

// ✅ NEW: School Entity Relations

export const lessonRelations = relations(lessons, ({ one }) => ({
  subject: one(subjects, { fields: [lessons.subjectId], references: [subjects.id] }),
  class: one(classes, { fields: [lessons.classId], references: [classes.id] }),
  teacher: one(teachers, { fields: [lessons.teacherId], references: [teachers.id] }),
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  supervisor: one(teachers, { fields: [classes.classTeacherId], references: [teachers.id] }),
  lessons: many(lessons), // A class has many lessons
}));

export const teacherRelations = relations(teachers, ({ many }) => ({
  lessons: many(lessons), // A teacher teaches many lessons
  classes: many(classes), // A teacher supervises many classes
}));

export const subjectRelations = relations(subjects, ({ many }) => ({
  lessons: many(lessons), // A subject is taught in many lessons
}));

// --- 1. ENUMS ---
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "FAILED",
]);

export const feeStatusEnum = pgEnum("fee_status", [
  "PENDING",
  "PAID",
  "PARTIALLY_PAID"
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "ONLINE",
  "CASH"
]);

// --- 2. FEE STRUCTURE (Settings per class) ---
export const feeStructure = pgTable("fee_structure", {
  id: serial("id").primaryKey(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" })
    .unique(), // One fee structure per class
  monthlyAmount: integer("monthly_amount").notNull(), // Store in cents/paise
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 3. FEE RECORDS (Monthly Bill for a Student) ---
export const feeRecords = pgTable("fee_records", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  
  // Snapshot of class ID at the time of bill generation (for historical accuracy)
  classId: integer("class_id").notNull(), 
  
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),   // 2024
  
  amount: integer("amount").notNull(), // Total fee amount for this month
  amountPaid: integer("amount_paid").default(0).notNull(),
  
  status: feeStatusEnum("status").default("PENDING").notNull(),
  dueDate: timestamp("due_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 4. PAYMENTS TABLE (Transaction History) ---
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  
  // Link payment to a specific fee bill
  feeRecordId: integer("fee_record_id")
    .references(() => feeRecords.id, { onDelete: "set null" }),

  amount: integer("amount").notNull(), 
  currency: text("currency").default("INR").notNull(),
  
  status: paymentStatusEnum("status").default("PENDING").notNull(),
  paymentMode: paymentModeEnum("payment_mode").default("ONLINE").notNull(),
  
  // Razorpay Specific Fields (Optional for CASH payments)
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  
  description: text("description"), 
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- 5. RELATIONS ---

export const feeStructureRelations = relations(feeStructure, ({ one }) => ({
  class: one(classes, { 
    fields: [feeStructure.classId], 
    references: [classes.id] 
  }),
}));

export const feeRecordRelations = relations(feeRecords, ({ one, many }) => ({
  student: one(students, { 
    fields: [feeRecords.studentId], 
    references: [students.id] 
  }),
  // One monthly bill can be paid in multiple installments (payments)
  payments: many(payments), 
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  student: one(students, { 
    fields: [payments.studentId], 
    references: [students.id] 
  }),
  // A payment belongs to a specific fee record (bill)
  feeRecord: one(feeRecords, {
    fields: [payments.feeRecordId],
    references: [feeRecords.id]
  })
}));

export const schoolSettings = pgTable("school_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default("My School"),
  schoolAddress: text("school_address").notNull().default("123 School Street"),
  schoolPhone: text("school_phone"),
  schoolEmail: text("school_email"),
  schoolWebsite: text("school_website"),
  
  // Academic Settings
  currentSession: text("current_session").default("2024-2025"), // e.g., "2024-2025"
  
  updatedAt: timestamp("updated_at").defaultNow(),
});