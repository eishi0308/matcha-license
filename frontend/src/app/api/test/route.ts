import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error, count } = await supabase
    .from("cafes")
    .select("id, name, city", { count: "exact" })
    .limit(3);

  return Response.json({
    success: !error,
    error: error ? error.message : null,
    totalCount: count,
    sampleRows: data,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
  });
}
