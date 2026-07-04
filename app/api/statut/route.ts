import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const STATUTS_VALIDES = ["deposee", "transmise", "en_traitement", "repondue"];

// POST /api/statut  { doleance_id | doleance_ids, statut }
// Met à jour le statut d'une (ou plusieurs) doléance(s) — utilisé par l'élu
// pour passer une demande « en cours de traitement » (étape intermédiaire),
// ce qui se reflète dans le suivi du citoyen.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const statut = body.statut;
    const ids: string[] = Array.isArray(body.doleance_ids)
      ? body.doleance_ids
      : body.doleance_id
        ? [body.doleance_id]
        : [];

    if (ids.length === 0 || !STATUTS_VALIDES.includes(statut)) {
      return NextResponse.json(
        { ok: false, erreur: "doleance_id(s) et statut valide requis." },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();
    const { error } = await db.from("doleances").update({ statut }).in("id", ids);
    if (error) throw error;

    return NextResponse.json({ ok: true, count: ids.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ ok: false, erreur: message }, { status: 500 });
  }
}
