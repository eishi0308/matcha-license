import { supabase } from "./supabase";
import { Cafe } from "@/data/cafes";

function rowToCafe(row: Record<string, unknown>): Cafe {
  const evidence =
    row.evidence_quote
      ? {
          quote: row.evidence_quote as string,
          source: row.evidence_source as string,
          sourceLabel: row.evidence_source_label as string,
          verifiedDate: row.evidence_verified_date as string,
        }
      : null;

  return {
    id: row.id as string,
    name: row.name as string,
    city: row.city as Cafe["city"],
    suburb: row.suburb as string,
    address: row.address as string,
    lat: row.lat as number,
    lng: row.lng as number,
    level: row.level as Cafe["level"],
    type: row.type as Cafe["type"],
    tagline: row.tagline as string,
    description: row.description as string,
    evidence,
    instagram: row.instagram as string | undefined,
    website: row.website as string | undefined,
    priceRange: row.price_range as Cafe["priceRange"],
    specialties: Array.isArray(row.specialties)
      ? row.specialties as string[]
      : typeof row.specialties === "string" && (row.specialties as string).length > 0
        ? (row.specialties as string).split(",").map((s) => s.trim())
        : [],
    coverColor: row.cover_color as string,
  };
}

export async function fetchCafes(params?: {
  city?: string;
  level?: string;
}): Promise<Cafe[]> {
  let query = supabase.from("cafes").select("*").order("name").limit(10000);

  if (params?.city && params.city !== "All") {
    query = query.eq("city", params.city);
  }
  if (params?.level && params.level !== "All") {
    query = query.eq("level", params.level);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[Supabase fetchCafes error]", error);
    throw new Error(error.message);
  }
  console.log("[Supabase] fetchCafes returned", data?.length, "rows");
  return (data ?? []).map(rowToCafe);
}

export async function fetchCafe(id: string): Promise<Cafe> {
  const { data, error } = await supabase
    .from("cafes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return rowToCafe(data);
}

export async function fetchStats(): Promise<{
  total: number;
  byLevel: Record<string, number>;
  sydney: number;
  melbourne: number;
  discovering: boolean;
}> {
  const { data, error } = await supabase.from("cafes").select("level, city").limit(10000);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const byLevel: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let sydney = 0;
  let melbourne = 0;

  for (const row of rows) {
    byLevel[row.level] = (byLevel[row.level] ?? 0) + 1;
    if (row.city === "Sydney") sydney++;
    if (row.city === "Melbourne") melbourne++;
  }

  return { total: rows.length, byLevel, sydney, melbourne, discovering: false };
}
