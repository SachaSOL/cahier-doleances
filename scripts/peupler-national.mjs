// Peuplement national à grande échelle : couvre les plus grandes communes de
// chaque département (donc toutes les villes connues), plusieurs doléances
// chacune, routées vers les vrais élus. Insertions par lots pour la vitesse.
//
// Usage : node --env-file=.env.local scripts/peupler-national.mjs [communesParDept] [maxParCommune]

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const COMMUNES_PAR_DEPT = parseInt(process.argv[2] ?? "30", 10);
const MAX_PAR_COMMUNE = parseInt(process.argv[3] ?? "4", 10);
const TAILLE_VIVIER = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TRANCHES = ["18-24", "25-34", "35-49", "50-64", "65+"];
const STATUTS = ["deposee", "deposee", "deposee", "transmise", "transmise", "en_traitement", "repondue", "repondue"];
const NIVEAU_PAR_THEME = {
  transports: "region", education: "region", sante: "etat",
  logement: "commune", securite: "commune", environnement: "commune",
  voirie: "commune", services_publics: "commune", autres: "commune",
};
const REPONSE_TYPE = "Bonjour, votre signalement a bien été reçu et transmis au service compétent. Une intervention est à l'étude ; vous serez informé(e) de son avancement dans votre espace de suivi. Merci de votre vigilance.";

const hasard = (a) => a[Math.floor(Math.random() * a.length)];

const PROMPT = `Tu génères des doléances citoyennes françaises FICTIVES mais réalistes,
valables dans n'importe quelle commune (aucun nom de ville). Varie thèmes, tons
et longueurs. Texte déjà anonymisé ([prénom], [téléphone] si besoin).
Réponds UNIQUEMENT avec un tableau JSON :
[{"texte_anonymise":"2-3 phrases","theme":"transports|logement|education|sante|securite|environnement|voirie|services_publics|autres","urgence":"faible|moyenne|haute","resume":"une phrase de 12 mots max"}]`;

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
    } catch { /* réessai */ }
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

async function topCommunes(dept, n) {
  try {
    const r = await fetch(`https://geo.api.gouv.fr/departements/${dept}/communes?fields=code,population`);
    const j = await r.json();
    return j.filter((c) => c.code).sort((a, b) => (b.population || 0) - (a.population || 0)).slice(0, n).map((c) => c.code);
  } catch { return []; }
}

const cacheRegionPres = new Map();
async function regionPresident(region) {
  if (!cacheRegionPres.has(region)) {
    const { data } = await db.from("elus").select("id").eq("niveau", "region").eq("territoire_code", region).limit(1);
    cacheRegionPres.set(region, data?.[0]?.id ?? null);
  }
  return cacheRegionPres.get(region);
}

let bufIdent = [], bufDol = [], bufRep = [], total = 0;
async function flush() {
  if (bufIdent.length === 0) return;
  await db.from("identites").insert(bufIdent);
  await db.from("doleances").insert(bufDol);
  if (bufRep.length) await db.from("reponses").insert(bufRep);
  total += bufDol.length;
  bufIdent = []; bufDol = []; bufRep = [];
}

async function main() {
  console.log(`Vivier Claude (${TAILLE_VIVIER} modèles)…`);
  const pool = await vivier(TAILLE_VIVIER);
  console.log(`  ${pool.length} modèles prêts.`);

  const deptRegion = await carteDeptRegion();
  const depts = Object.keys(deptRegion).filter((d) => /^(\d{2}|2A|2B)$/.test(d));

  for (const dept of depts) {
    const region = deptRegion[dept];
    const communes = await topCommunes(dept, COMMUNES_PAR_DEPT);
    if (communes.length === 0) continue;

    // Élus du département : maires (par lot), président CD, un député.
    const { data: maires } = await db.from("elus").select("id,territoire_code").eq("niveau", "commune").in("territoire_code", communes);
    const maireDe = new Map((maires ?? []).map((m) => [m.territoire_code, m.id]));
    const { data: cd } = await db.from("elus").select("id").eq("niveau", "departement").eq("territoire_code", dept).limit(1);
    const { data: dep } = await db.from("elus").select("id").eq("niveau", "etat").eq("territoire_code", dept).limit(1);
    const idCD = cd?.[0]?.id ?? null;
    const idDep = dep?.[0]?.id ?? null;
    const idRegion = await regionPresident(region);

    for (const insee of communes) {
      const maire = maireDe.get(insee);
      if (!maire) continue;
      const nb = 1 + Math.floor(Math.random() * MAX_PAR_COMMUNE);
      const dispo = [...pool];
      for (let k = 0; k < nb && dispo.length; k++) {
        const modele = dispo.splice(Math.floor(Math.random() * dispo.length), 1)[0];
        const niveau = NIVEAU_PAR_THEME[modele.theme] ?? "commune";
        const eluId = niveau === "commune" ? maire : niveau === "region" ? idRegion : niveau === "etat" ? idDep : idCD;
        const statut = hasard(STATUTS);
        const identId = randomUUID();
        const dolId = randomUUID();
        bufIdent.push({ id: identId, fc_sub_mock: `fc-n-${randomUUID().slice(0, 12)}`, tranche_age: hasard(TRANCHES), code_insee: insee });
        bufDol.push({
          id: dolId, pseudo_id: identId, texte_anonymise: modele.texte_anonymise,
          theme: modele.theme, urgence: modele.urgence, resume: modele.resume,
          code_insee: insee, elu_id: eluId ?? maire, statut,
        });
        if (statut === "repondue" && Math.random() < 0.5) {
          bufRep.push({ doleance_id: dolId, texte: REPONSE_TYPE, auteur: "Secrétariat" });
        }
      }
      if (bufIdent.length >= 500) await flush();
    }
    process.stdout.write(`\r  ${total + bufDol.length} doléances (dept ${dept})      `);
  }
  await flush();
  const { count } = await db.from("doleances").select("*", { count: "exact", head: true });
  console.log(`\nTerminé : ${total} nouvelles doléances insérées. Total en base : ${count}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
