import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const supabaseUrl = process.env.DB_URL;
const supabaseKey = process.env.DB_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('DB_URL and DB_SECRET_KEY must be defined in environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);