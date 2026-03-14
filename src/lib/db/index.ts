// This file previously initialized lowdb.
// Now all DB access goes through Supabase client at @/lib/supabase.
// Kept for backward compatibility — re-exports supabase.
export { supabase } from "@/lib/supabase";
