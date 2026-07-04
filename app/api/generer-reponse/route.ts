import { NextResponse } from "next/server";
import { askClaudeJSON, claudeDisponible } from "@/lib/claude";
import { PROMPT_REPONSE_ELU } from "@/lib/prompts";

// POST /api/generer-reponse  { texte, mandat? }
// Rédige un BROUILLON de réponse (relu/modifié par l'élu avant envoi).
export async function POST(req: Request) {
  try {
    const { texte } = await req.json();
    if (!texte || !String(texte).trim()) {
      return NextResponse.json({ ok: false, erreur: "texte requis." }, { status: 400 });
    }

    if (claudeDisponible()) {
      try {
        const r = await askClaudeJSON<{ reponse: string }>(PROMPT_REPONSE_ELU, texte);
        if (r?.reponse) return NextResponse.json({ ok: true, reponse: r.reponse });
      } catch {
        /* on bascule sur le repli */
      }
    }

    // Repli : brouillon générique si Claude est indisponible.
    return NextResponse.json({
      ok: true,
      reponse:
        "Bonjour, nous avons bien reçu votre signalement et vous en remercions. " +
        "Votre demande a été transmise au service compétent pour examen. Vous serez " +
        "informé(e) de son avancement dans votre espace de suivi. Nous restons " +
        "attentifs à la situation que vous décrivez.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ ok: false, erreur: message }, { status: 500 });
  }
}
