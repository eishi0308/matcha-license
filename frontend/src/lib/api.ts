import { Cafe } from "@/data/cafes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchCafes(params?: {
  city?: string;
  level?: string;
}): Promise<Cafe[]> {
  const url = new URL(`${API_URL}/api/cafes`);
  if (params?.city && params.city !== "All") url.searchParams.set("city", params.city);
  if (params?.level && params.level !== "All") url.searchParams.set("level", params.level);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch cafes: ${res.status}`);
  return res.json();
}

export async function fetchCafe(id: string): Promise<Cafe> {
  const res = await fetch(`${API_URL}/api/cafes/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cafe not found: ${id}`);
  return res.json();
}

export async function fetchStats(): Promise<{
  total: number;
  byLevel: Record<string, number>;
  sydney: number;
  melbourne: number;
  discovering: boolean;
}> {
  const res = await fetch(`${API_URL}/api/cafes/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function triggerDiscovery(): Promise<{ status: string; discovered: number }> {
  const res = await fetch(`${API_URL}/api/cafes/discover`, { method: "POST" });
  if (!res.ok) throw new Error("Discovery failed");
  return res.json();
}
