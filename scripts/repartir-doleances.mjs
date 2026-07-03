// Peuple la base de doléances réalistes réparties sur TOUTE la France,
// routées vers les vrais élus (maire / président de département / de région /
// député selon le thème). Objectif : aucun territoire vide dans la démo.
//
// Usage : node --env-file=.env.local scripts/repartir-doleances.mjs [communesParDept] [doleancesParCommune]

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const COMMUNES_PAR_DEPT = parseInt(process.argv[2] ?? "2", 10);
const DOL_PAR_COMMUNE = parseInt(process.argv[3] ?? "2", 10);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRANCHES = ["18-24", "25-34", "35-49", "50-64", "65+"];
const STATUTS = ["deposee", "deposee", "transmise", "transmise", "en_traitement", "repondue"];

const NIVEAU_PAR_THEME = {
  transports: "region",
  education: "region",
  sante: "etat",
  logement: "commune",
  securite: "commune",
  environnement: "commune",
  voirie: "commune",
  services_publics: "commune",
  autres: "commune",
};

const hasard = (a) => a[Math.floor(Math.random() * a.length)];
const melange = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

// --- 1) Génère un vivier de doléances génériques (sans ville) via Claude ---
const PROMPT = `Tu génères des doléances citoyennes françaises FICTIVES mais réalistes,
valables dans n'importe quelle commune (pas de nom de ville précis). Varie les
thèmes, les tons (poli, sec, exaspéré, digne) et les longueurs. Texte déjà
anonymisé (utilise [prénom], [téléphone] si besoin).
Réponds UNIQUEMENT avec un tableau JSON :
[{"texte_anonymise":"2-3 phrases","theme":"transports|logement|education|sante|securite|environnement|voirie|services_publics|autres","urgence":"faible|moyenne|haute","resume":"une phrase de 12 mots max commençant par le problème"}]`;

async function genererVivier(n) {
  const out = [];
  while (out.length < n) {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      system: PROMPT,
      messages: [{ role: "user", content: `Génère ${Math.min(16, n - out.length)} doléances variées.` }],
    });
    const raw = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    try {
      const lot = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (Array.isArray(lot)) out.push(...lot);
    } catch {
      /* on réessaie */
    }
  }
  return out;
}

// --- 2) Carte département -> région (geo.api.gouv.fr) ---
async function carteDeptRegion() {
  const r = await fetch("https://geo.api.gouv.fr/departements");
  const j = await r.json();
  const m = {};
  for (const d of j) m[d.code] = d.codeRegion;
  return m;
}

// --- 3) Sélection d'élu (avec cache) ---
const cacheElu = new Map();
async function eluId(theme, insee, dept, region) {
  const niveau = NIVEAU_PAR_THEME[theme] ?? "commune";
  const terr = niveau === "commune" ? insee : niveau === "region" ? region : dept;
  const cle = `${niveau}:${terr}`;
  if (!cacheElu.has(cle)) {
    let { data } = await db.from("elus").select("id").eq("niveau", niveau).eq("territoire_code", terr).limit(1);
    if (!data?.length) {
      ({ data } = await db.from("elus").select("id").eq("niveau", "commune").eq("territoire_code", insee).limit(1));
    }
    cacheElu.set(cle, data?.[0]?.id ?? null);
  }
  return cacheElu.get(cle);
}

// --- 4) Communes réelles par département (depuis notre table elus) ---
async function communesDuDept(dept) {
  const { data } = await db
    .from("elus")
    .select("territoire_code")
    .eq("niveau", "commune")
    .like("territoire_code", `${dept}%`)
    .limit(40);
  const codes = [...new Set((data ?? []).map((e) => e.territoire_code))];
  return melange(codes).slice(0, COMMUNES_PAR_DEPT);
}

const REPONSE_TYPE = "Bonjour, votre signalement a bien été reçu et transmis au service compétent. Une intervention est à l'étude. Vous serez informé(e) de son avancement dans votre espace de suivi. Merci de votre vigilance.";

async function main() {
  console.log("Génération du vivier de doléances via Claude…");
  const vivier = await genererVivier(48);
  console.log(`  ${vivier.length} doléances-modèles prêtes.`);

  const deptRegion = await carteDeptRegion();
  const depts = Object.keys(deptRegion).filter((d) => /^(\d{2}|2A|2B)$/.test(d)); // métropole + Corse

  let inserees = 0;
  for (const dept of depts) {
    const region = deptRegion[dept];
    const communes = await communesDuDept(dept);
    for (const insee of communes) {
      const nb = 1 + Math.floor(Math.random() * DOL_PAR_COMMUNE);
      for (let k = 0; k < nb; k++) {
        const modele = hasard(vivier);
        const { data: ident } = await db
          .from("identites")
          .insert({ fc_sub_mock: `fc-fr-${randomUUID().slice(0, 8)}`, tranche_age: hasard(TRANCHES), code_insee: insee })
          .select("id")
          .single();
        if (!ident) continue;
        const statut = hasard(STATUTS);
        const { data: dol } = await db
          .from("doleances")
          .insert({
            pseudo_id: ident.id,
            texte_anonymise: modele.texte_anonymise,
            theme: modele.theme,
            urgence: modele.urgence,
            resume: modele.resume,
            code_insee: insee,
            elu_id: await eluId(modele.theme, insee, dept, region),
            statut,
          })
          .select("id")
          .single();
        if (dol && statut === "repondue" && Math.random() < 0.6) {
          await db.from("reponses").insert({ doleance_id: dol.id, texte: REPONSE_TYPE, auteur: "Secrétariat" });
        }
        inserees++;
      }
    }
    process.stdout.write(`\r  ${inserees} doléances insérées (dept ${dept})     `);
  }
  const { count } = await db.from("doleances").select("*", { count: "exact", head: true });
  console.log(`\nTerminé : ${inserees} nouvelles doléances. Total en base : ${count}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
