import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      "https://rcftroimovojjjrgasjc.supabase.co",
      "sb_publishable_9_Ene4D1c7WYoq4f6en0aw_QsdQP4p1"
    );
  }
  return _client;
}

// Proxy defers createClient until first actual use (inside useEffect, not during SSR pre-render)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as any)[prop as any];
  },
});
