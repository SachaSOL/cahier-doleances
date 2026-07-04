import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { departementsDeRegion } from "@/lib/territoire";

// GET /api/stats?niveau=region
// GET /api/stats?niveau=departement&region=53
// GET /api/stats?niveau=commune&dept=35
// Renvoie le nombre de doléances par territoire, pour colorer la carte.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const niveau = p.get("niveau") ?? "region";
  const db = supabaseAdmin();

  const compteDepts = async (depts: string[]) => {
    let q = db.from("doleances").select("id", { count: "exact", head: true });
    if (depts.length) q = q.or(depts.map((d) => `code_insee.like.${d}%`).join(","));
    const { count } = await q;
    return count ?? 0;
  };

  if (niveau === "region") {
    // 13 régions métropolitaines (codes connus).
    const regions = ["11", "24", "27", "28", "32", "44", "52", "53", "75", "76", "84", "93", "94"];
    const counts = await Promise.all(
      regions.map(async (code) => ({
        code,
        count: await compteDepts(await departementsDeRegion(code)),
      }))
    );
    return NextResponse.json({ counts });
  }

  if (niveau === "departement") {
    const region = p.get("region") ?? "";
    const depts = await departementsDeRegion(region);
    const counts = await Promise.all(
      depts.map(async (code) => ({ code, count: await compteDepts([code]) }))
    );
    return NextResponse.json({ counts });
  }

  if (niveau === "commune") {
    const dept = p.get("dept") ?? "";
    const { data } = await db
      .from("doleances")
      .select("code_insee")
      .like("code_insee", `${dept}%`)
      .limit(100000);
    const map: Record<string, number> = {};
    (data ?? []).forEach((d) => {
      map[d.code_insee] = (map[d.code_insee] ?? 0) + 1;
    });
    return NextResponse.json({
      counts: Object.entries(map).map(([code, count]) => ({ code, count })),
    });
  }

  return NextResponse.json({ counts: [] });
}
