import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  appliquerFiltre,
  communesDuDepartement,
  deptDeInsee,
  type NiveauTerr,
} from "@/lib/territoire";

// GET /api/doleances?niveau=region&code=11[&statut=deposee]
// Flux ANONYMISÉ : ne renvoie jamais la table identites (ni nom, ni adresse).
// Le texte est déjà anonymisé à l'ingestion. Sert à la fois à la vue publique
// citoyenne et à la boîte de réception des élus.
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const niveau = (p.get("niveau") ?? "national") as NiveauTerr;
  const code = p.get("code") ?? "";
  const statut = p.get("statut");

  const db = supabaseAdmin();
  let query = db
    .from("doleances")
    .select(
      "id, texte_anonymise, theme, urgence, resume, code_insee, statut, created_at, elus(nom,mandat,niveau), reponses(texte,created_at,auteur)"
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (statut) query = query.eq("statut", statut);
  query = await appliquerFiltre(query as never, niveau, code);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ doleances: [], erreur: error.message }, { status: 500 });

  // Enrichit chaque doléance du nom de sa commune (1 appel geo par département
  // présent, mémoïsé) → sert à indiquer « reçue par … à … ».
  const rows = data ?? [];
  const depts = [...new Set(rows.map((d) => deptDeInsee(d.code_insee)))];
  const cartes = new Map<string, Map<string, string>>();
  await Promise.all(
    depts.map(async (dep) => cartes.set(dep, await communesDuDepartement(dep)))
  );
  const enrichies = rows.map((d) => ({
    ...d,
    commune_nom: cartes.get(deptDeInsee(d.code_insee))?.get(d.code_insee) ?? null,
  }));

  return NextResponse.json({ doleances: enrichies });
}
