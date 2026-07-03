import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/reponse  { doleance_id, texte, auteur? }
// L'élu répond à une doléance : la réponse est enregistrée ET le statut de la
// doléance passe à « repondue » — ce qui se reflète dans le suivi du citoyen.
export async function POST(req: Request) {
  try {
    const { doleance_id, texte, auteur } = await req.json();
    if (!doleance_id || !texte || !String(texte).trim()) {
      return NextResponse.json(
        { ok: false, erreur: "doleance_id et texte sont requis." },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();
    const { error: e1 } = await db
      .from("reponses")
      .insert({ doleance_id, texte, auteur: auteur ?? "Élu" });
    if (e1) throw e1;

    const { error: e2 } = await db
      .from("doleances")
      .update({ statut: "repondue" })
      .eq("id", doleance_id);
    if (e2) throw e2;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json(
      { ok: false, erreur: "Erreur serveur : " + message },
      { status: 500 }
    );
  }
}
