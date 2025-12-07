import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../src/db/schema"; // <--- 1. Import your schema

// Make sure this is in your .env file
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, {schema});