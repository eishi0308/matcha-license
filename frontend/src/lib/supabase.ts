import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rcftroimovojjjrgasjc.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_9_Ene4D1c7WYoq4f6en0aw_QsdQP4p1"
);
