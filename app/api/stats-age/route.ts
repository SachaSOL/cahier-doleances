import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { appliquerFiltre, type NiveauTerr } from "@/lib/territoire";

// GET /api/stats-age?niveau=&code=[&theme=]
// Répartition AGRÉGÉE des doléances par tranche d'âge (jamais individuelle) —
// pour le graphique de l'espace élu. Les tranches viennent de la table identites.
const ORDRE = ["18-24", "25-34", "35-49", "50-64", "65+"];

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const niveau = (p.get("niveau") ?? "national") as NiveauTerr;
  const code = p.get("code") ?? "";
  const theme = p.get("theme") || null;
  const db = supabaseAdmin();

  let q = db
    .from("doleances")
    .select("identites(tranche_age)")
    .limit(50000);
  if (theme) q = q.eq("theme", theme);
  q = await appliquerFiltre(q as never, niveau, code);

  const { data } = await q;
  const map: Record<string, number> = {};
  ((data ?? []) as { identites: { tranche_age: string } | { tranche_age: string }[] | null }[]).forEach(
    (d) => {
      const ident = Array.isArray(d.identites) ? d.identites[0] : d.identites;
      const t = ident?.tranche_age;
      if (t) map[t] = (map[t] ?? 0) + 1;
    }
  );

  const counts = ORDRE.filter((t) => map[t]).map((t) => ({ tranche: t, count: map[t] }));
  return NextResponse.json({ counts });
}
