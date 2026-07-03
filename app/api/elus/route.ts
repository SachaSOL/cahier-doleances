import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/elus?q=<nom>
// Recherche d'un élu par son nom, pour l'inscription « je suis élu ».
// Renvoie son niveau et son territoire → sélection automatique.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ elus: [] });

  const db = supabaseAdmin();
  const { data } = await db
    .from("elus")
    .select("id, nom, mandat, niveau, territoire_code")
    .ilike("nom", `%${q}%`)
    .limit(8);

  return NextResponse.json({ elus: data ?? [] });
}
