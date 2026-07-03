import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/mes-doleances?fc=<pseudonyme>
// Renvoie les doléances déposées par CE citoyen (via son identité de démo),
// avec l'élu destinataire et les réponses éventuelles.
export async function GET(req: Request) {
  const fc = new URL(req.url).searchParams.get("fc");
  if (!fc) return NextResponse.json({ doleances: [] });

  const db = supabaseAdmin();
  const { data: ident } = await db
    .from("identites")
    .select("id")
    .eq("fc_sub_mock", fc)
    .maybeSingle();
  if (!ident) return NextResponse.json({ doleances: [] });

  const { data } = await db
    .from("doleances")
    .select(
      "id, texte_anonymise, theme, urgence, resume, code_insee, statut, created_at, elus(nom,mandat,niveau), reponses(texte,created_at,auteur)"
    )
    .eq("pseudo_id", ident.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ doleances: data ?? [] });
}
