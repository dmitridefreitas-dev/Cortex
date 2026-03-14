import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side client using service role key (bypasses RLS)
// Used in API routes for full CRUD access
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
