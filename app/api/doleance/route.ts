import { NextResponse } from "next/server";
import { runPipeline, choisirElu } from "@/lib/pipeline";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/doleance
// Corps attendu : { texte, code_insee, fc_sub_mock?, tranche_age? }
// Enchaîne : identité (upsert) → pipeline (anonymise, classe, route) → insertion.
export async function POST(req: Request) {
  try {
    const { texte, code_insee, commune, fc_sub_mock, tranche_age } =
      await req.json();

    // Le front peut envoyer un nom de commune : on le convertit en code INSEE
    // via l'API officielle (la plus grande commune homonyme gagne).
    let insee: string | undefined = code_insee;
    if (!insee && commune) {
      const geo = await fetch(
        "https://geo.api.gouv.fr/communes?nom=" +
          encodeURIComponent(commune) +
          "&fields=code&boost=population&limit=1"
      );
      const resultats = (await geo.json()) as { code: string }[];
      insee = resultats?.[0]?.code;
    }

    if (!texte || !insee) {
      return NextResponse.json(
        { ok: false, erreur: "Champs requis : texte, et commune (ou code_insee)." },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    const { data: identite, error: erreurIdentite } = await db
      .from("identites")
      .upsert(
        {
          fc_sub_mock: fc_sub_mock ?? "fc-demo-invite",
          tranche_age: tranche_age || "25-34",
          code_insee: insee,
        },
        { onConflict: "fc_sub_mock" }
      )
      .select("id")
      .single();
    if (erreurIdentite) throw erreurIdentite;

    const resultat = await runPipeline(texte, insee);
    const elu = await choisirElu(resultat.niveau, insee);

    const { data: doleance, error: erreurDoleance } = await db
      .from("doleances")
      .insert({
        pseudo_id: identite.id,
        texte_anonymise: resultat.texte_anonymise,
        theme: resultat.theme,
        urgence: resultat.urgence,
        resume: resultat.resume,
        code_insee: insee,
        elu_id: elu?.id ?? null,
        statut: "transmise",
      })
      .select("id, statut, created_at")
      .single();
    if (erreurDoleance) throw erreurDoleance;

    // Signal collectif : combien de doléances du même thème dans le même secteur
    // (département) ce mois-ci (hors celle qu'on vient de créer). Le niveau
    // département donne un signal collectif fort tout en restant local.
    const dept =
      insee.startsWith("2A") || insee.startsWith("2B")
        ? insee.slice(0, 2)
        : insee.startsWith("97") || insee.startsWith("98")
          ? insee.slice(0, 3)
          : insee.slice(0, 2);
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const { count } = await db
      .from("doleances")
      .select("id", { count: "exact", head: true })
      .eq("theme", resultat.theme)
      .like("code_insee", `${dept}%`)
      .gte("created_at", debutMois.toISOString());
    const similaires = Math.max(0, (count ?? 1) - 1);

    return NextResponse.json({ ok: true, doleance, elu, similaires, ...resultat });
  } catch (err) {
    // Message lisible quel que soit le type d'erreur (Error, objet Supabase...)
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
          ? JSON.stringify(err)
          : String(err);
    return NextResponse.json(
      { ok: false, erreur: "Erreur serveur : " + message },
      { status: 500 }
    );
  }
}
