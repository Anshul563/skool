import "dotenv/config";
import { db } from "../../lib/db";
import * as schema from "../db/schema"; // <--- Import Schema
import { betterAuth } from "better-auth"; 
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const auth = betterAuth({
    database: drizzleAdapter(db, { 
        provider: "pg",
        schema: schema // <--- PASS SCHEMA HERE
    }),
    emailAndPassword: { enabled: true },
});

async function main() {
    // Check if admin already exists to prevent duplicate errors
    const existingUser = await db.query.user.findFirst({
        where: (table, { eq }) => eq(table.email, "admin@skool.com")
    });

    if (existingUser) {
        console.log("⚠️ Admin already exists. You can log in now.");
        process.exit(0);
    }

    console.log("Creating Super Admin...");
    
    await auth.api.signUpEmail({
        body: {
            email: "admin@skool.com",
            password: "adminpassword123", 
            name: "School Principal",
           role: "admin" as any,
        }
    });

    console.log("✅ Admin created successfully");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});