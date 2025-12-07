import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { admin } from "better-auth/plugins";
// 1. IMPORT YOUR SCHEMA HERE
import * as schema from "../src/db/schema"; 

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    // 2. PASS THE SCHEMA HERE
    schema: schema, 
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin() 
  ] 
});