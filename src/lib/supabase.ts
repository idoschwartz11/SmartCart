import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Configuration
 *
 * Setup:
 * 1. Create a .env file in the project root:
 *    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
 *
 * 2. Get your credentials from:
 *    https://app.supabase.com/project/YOUR_PROJECT/settings/api
 *
 * 3. The app will automatically use Supabase data if configured,
 *    otherwise it falls back to local demo data.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
