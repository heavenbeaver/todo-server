import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const supabaseUrl = process.env.DB_URL;
const supabaseKey = process.env.DB_SECRET_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);