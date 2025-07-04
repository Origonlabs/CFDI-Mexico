import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseEnabled = !!(supabaseUrl && supabaseAnonKey);

const supabase = supabaseEnabled ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

if (!supabaseEnabled) {
  console.warn("Supabase is not configured. Database features will be disabled. Please update your .env.local file.");
}

export { supabase, supabaseEnabled };
