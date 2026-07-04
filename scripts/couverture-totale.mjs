// Couvre TOUTES les communes de France : parcourt les 34 637 maires de la table
// elus et ajoute 1 à 3 doléances par commune (routées vers les vrais élus).
// Insertions par lots. Objectif : aucune commune vide, même les plus petites.
//
// Usage : node --env-file=.env.local scripts/couverture-totale.mjs [maxParCommune]

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const MAX_PAR_COMMUNE = parseInt(process.argv[2] ?? "3", 10);
const TAILLE_VIVIER = 150;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRANCHES = ["18-24", "25-34", "35-49", "50-64", "65+"];
const STATUTS = ["deposee", "deposee", "transmise", "transmise", "en_traitement", "repondue", "repondue"];
const NIVEAU_PAR_THEME = {
  transports: "region", education: "region", sante: "etat",
  logement: "commune", securite: "commune", environnement: "commune",
  voirie: "commune", services_publics: "commune", autres: "commune",
};
const REPONSE_TYPE = "Bonjour, votre signalement a bien été reçu et transmis au service compétent. Une intervention est à l'étude ; vous serez informé(e) de son avancement. Merci de votre vigilance.";
const hasard = (a) => a[Math.floor(Math.random() * a.length)];

const PROMPT = `Tu génères des doléances citoyennes françaises FICTIVES mais réalistes,
valables dans n'importe quelle commune (aucun nom de ville). Varie thèmes, tons, longueurs.
Texte déjà anonymisé ([prénom], [téléphone] si besoin).
Réponds UNIQUEMENT avec un tableau JSON :
[{"texte_anonymise":"2-3 phrases","theme":"transports|logement|education|sante|securite|environnement|voirie|services_publics|autres","urgence":"faible|moyenne|haute","resume":"phrase de 12 mots max"}]`;

async function vivier(n) {
  const out = [];
  while (out.length < n) {
    try {
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-5", max_tokens: 4000, system: PROMPT,
        messages: [{ role: "user", content: `Génère ${Math.min(16, n - out.length)} doléances variées.` }],
      });
      const raw = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const lot = JSON.parse(raw.replace(/```json|```/g, "").trim());
      if (Array.isArray(lot)) out.push(...lot);
    } catch { /* retry */ }
  }
  return out;
}

async function carteDeptRegion() {
  const r = await fetch("https://geo.api.gouv.fr/departements");
  const j = await r.json();
  const m = {};
  for (const d of j) m[d.code] = d.codeRegion;
  return m;
}
function deptDeInsee(insee) {
  if (insee.startsWith("2A") || insee.startsWith("2B")) return insee.slice(0, 2);
  if (insee.startsWith("97") || insee.startsWith("98")) return insee.slice(0, 3);
  return insee.slice(0, 2);
}

const cacheElu = new Map();
async function eluTerritorial(niveau, terr) {
  const cle = `${niveau}:${terr}`;
  if (!cacheElu.has(cle)) {
    const { data } = await db.from("elus").select("id").eq("niveau", niveau).eq("territoire_code", terr).limit(1);
    cacheElu.set(cle, data?.[0]?.id ?? null);
  }
  return cacheElu.get(cle);
}

let bufI = [], bufD = [], bufR = [], total = 0;
async function flush() {
  if (bufI.length === 0) return;
  await db.from("identites").insert(bufI);
  await db.from("doleances").insert(bufD);
  if (bufR.length) await db.from("reponses").insert(bufR);
  total += bufD.length;
  bufI = []; bufD = []; bufR = [];
}

async function main() {
  console.log(`Vivier Claude (${TAILLE_VIVIER})…`);
  const pool = await vivier(TAILLE_VIVIER);
  console.log(`  ${pool.length} modèles.`);
  const deptRegion = await carteDeptRegion();

  // Parcourt toutes les communes (maires) par pages de 1000.
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data: communes } = await db
      .from("elus")
      .select("id,territoire_code")
      .eq("niveau", "commune")
      .range(from, from + PAGE - 1);
    if (!communes || communes.length === 0) break;

    for (const c of communes) {
      const insee = c.territoire_code;
      const dept = deptDeInsee(insee);
      const region = deptRegion[dept];
      const nb = 1 + Math.floor(Math.random() * MAX_PAR_COMMUNE);
      const dispo = [...pool];
      for (let k = 0; k < nb && dispo.length; k++) {
        const m = dispo.splice(Math.floor(Math.random() * dispo.length), 1)[0];
        const niveau = NIVEAU_PAR_THEME[m.theme] ?? "commune";
        let eluId = c.id;
        if (niveau === "region") eluId = (await eluTerritorial("region", region)) ?? c.id;
        else if (niveau === "etat") eluId = (await eluTerritorial("etat", dept)) ?? c.id;
        else if (niveau === "departement") eluId = (await eluTerritorial("departement", dept)) ?? c.id;
        const statut = hasard(STATUTS);
        const iid = randomUUID(), did = randomUUID();
        bufI.push({ id: iid, fc_sub_mock: `fc-cov-${randomUUID().slice(0, 12)}`, tranche_age: hasard(TRANCHES), code_insee: insee });
        bufD.push({ id: did, pseudo_id: iid, texte_anonymise: m.texte_anonymise, theme: m.theme, urgence: m.urgence, resume: m.resume, code_insee: insee, elu_id: eluId, statut });
        if (statut === "repondue" && Math.random() < 0.5) bufR.push({ doleance_id: did, texte: REPONSE_TYPE, auteur: "Secrétariat" });
      }
      if (bufI.length >= 1000) await flush();
    }
    from += PAGE;
    process.stdout.write(`\r  ${total + bufD.length} doléances (communes ${from})   `);
  }
  await flush();
  const { count } = await db.from("doleances").select("*", { count: "exact", head: true });
  console.log(`\nTerminé : ${total} nouvelles doléances. Total en base : ${count}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
