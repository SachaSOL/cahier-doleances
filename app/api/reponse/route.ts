import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/reponse  { doleance_id, texte, auteur? }
// L'élu répond à une doléance : la réponse est enregistrée ET le statut de la
// doléance passe à « repondue » — ce qui se reflète dans le suivi du citoyen.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { texte, auteur } = body;
    // Accepte une seule doléance (doleance_id) ou plusieurs (doleance_ids).
    const ids: string[] = Array.isArray(body.doleance_ids)
      ? body.doleance_ids
      : body.doleance_id
        ? [body.doleance_id]
        : [];

    if (ids.length === 0 || !texte || !String(texte).trim()) {
      return NextResponse.json(
        { ok: false, erreur: "doleance_id(s) et texte sont requis." },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();
    const { error: e1 } = await db
      .from("reponses")
      .insert(ids.map((id) => ({ doleance_id: id, texte, auteur: auteur ?? "Élu" })));
    if (e1) throw e1;

    const { error: e2 } = await db
      .from("doleances")
      .update({ statut: "repondue" })
      .in("id", ids);
    if (e2) throw e2;

    return NextResponse.json({ ok: true, count: ids.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json(
      { ok: false, erreur: "Erreur serveur : " + message },
      { status: 500 }
    );
  }
}
