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
  const PAGE = 1000;
  const allRows: Record<string, unknown>[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from("cafes")
      .select("*")
      .order("name")
      .range(from, from + PAGE - 1);

    if (params?.city && params.city !== "All") query = query.eq("city", params.city);
    if (params?.level && params.level !== "All") query = query.eq("level", params.level);

    const { data, error } = await query;
    if (error) {
      console.error("[Supabase fetchCafes error]", error);
      throw new Error(error.message);
    }
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log("[Supabase] fetchCafes returned", allRows.length, "rows");
  return allRows.map(rowToCafe);
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
  const PAGE = 1000;
  const allRows: { level: string; city: string }[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("cafes")
      .select("level, city")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const byLevel: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  let sydney = 0;
  let melbourne = 0;

  for (const row of allRows) {
    byLevel[row.level] = (byLevel[row.level] ?? 0) + 1;
    if (row.city === "Sydney") sydney++;
    if (row.city === "Melbourne") melbourne++;
  }

  return { total: allRows.length, byLevel, sydney, melbourne, discovering: false };
}
