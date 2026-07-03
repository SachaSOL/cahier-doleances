// Générateur de fausses doléances réalistes (via Claude) — tâche « données ».
// Usage :  node --env-file=.env.local scripts/generer-doleances.mjs [nombre]
// Exemple : node --env-file=.env.local scripts/generer-doleances.mjs 24

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const NB = parseInt(process.argv[2] ?? "20", 10);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COMMUNES = [
  "75056", "93066", "77288", "78646", "94028",
  "92050", "95127", "91228", "77284",
];
const TRANCHES = ["18-24", "25-34", "35-49", "50-64", "65+"];
// deposee/transmise majoritaires : une base "vivante" mais pas déjà toute traitée
const STATUTS = ["deposee", "deposee", "transmise", "transmise", "en_traitement", "repondue"];

const NIVEAU_PAR_THEME = {
  transports: "region",
  education: "region",
  sante: "region", // pas d'élu "etat" en base : routé région, comme le seed
  logement: "commune",
  securite: "commune",
  environnement: "commune",
  voirie: "commune",
  services_publics: "commune",
  autres: "commune",
};

const PROMPT_GENERATION = `Tu génères des doléances citoyennes françaises FICTIVES mais très réalistes,
pour alimenter la démo d'une plateforme civique. Ancre les sujets en Île-de-France
(RER, lycées, logement, déserts médicaux de grande couronne, voirie, propreté...).
Varie fortement : thèmes, tons (familier, sec, poli, exaspéré, digne), longueurs,
situations de vie. Jamais deux doléances semblables. Texte déjà anonymisé :
utilise [prénom], [téléphone], [adresse] si le citoyen aurait mis du personnel.

Réponds UNIQUEMENT avec un tableau JSON, sans commentaire :
[{"texte_anonymise":"2 à 3 phrases",
  "theme":"transports|logement|education|sante|securite|environnement|voirie|services_publics|autres",
  "urgence":"faible|moyenne|haute",
  "resume":"une phrase factuelle de 15 mots max, commençant par le problème"}]`;

const hasard = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function genererLot(n) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: PROMPT_GENERATION,
    messages: [{ role: "user", content: `Génère ${n} doléances.` }],
  });
  // Claude 5 peut renvoyer un bloc "thinking" avant le texte : ne lire que le texte.
  const raw = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const lot = JSON.parse(raw.replace(/```json|```/g, "").trim());
  if (!Array.isArray(lot) || lot.length === 0) {
    throw new Error("Génération vide — réponse brute : " + raw.slice(0, 200));
  }
  return lot;
}

const cacheElus = new Map();
async function eluPour(theme, codeInsee) {
  const niveau = NIVEAU_PAR_THEME[theme] ?? "commune";
  const territoire =
    niveau === "commune" ? codeInsee
    : niveau === "departement" ? codeInsee.slice(0, 2)
    : "11";
  const cle = `${niveau}:${territoire}`;
  if (!cacheElus.has(cle)) {
    let { data } = await db.from("elus").select("id")
      .eq("niveau", niveau).eq("territoire_code", territoire).limit(1);
    if (!data?.length) {
      ({ data } = await db.from("elus").select("id")
        .eq("niveau", "region").eq("territoire_code", "11").limit(1));
    }
    cacheElus.set(cle, data?.[0]?.id ?? null);
  }
  return cacheElus.get(cle);
}

let inserees = 0;
let tentatives = 0;
const parTheme = {};

// tentatives : garde-fou anti-boucle-infinie si les insertions échouent en série
while (inserees < NB && tentatives < Math.ceil(NB / 8) + 3) {
  tentatives++;
  const taille = Math.min(8, NB - inserees);
  process.stdout.write(`Génération d'un lot de ${taille}... `);
  const lot = await genererLot(taille);
  for (const d of lot) {
    const code_insee = hasard(COMMUNES);
    const { data: identite, error: e1 } = await db.from("identites")
      .insert({
        fc_sub_mock: `fc-gen-${randomUUID().slice(0, 8)}`,
        tranche_age: hasard(TRANCHES),
        code_insee,
      })
      .select("id").single();
    if (e1) { console.error("identite:", e1.message); continue; }
    const { error: e2 } = await db.from("doleances").insert({
      pseudo_id: identite.id,
      texte_anonymise: d.texte_anonymise,
      theme: d.theme,
      urgence: d.urgence,
      resume: d.resume,
      code_insee,
      elu_id: await eluPour(d.theme, code_insee),
      statut: hasard(STATUTS),
    });
    if (e2) { console.error("doleance:", e2.message); continue; }
    inserees++;
    parTheme[d.theme] = (parTheme[d.theme] ?? 0) + 1;
  }
  console.log("ok");
}

const { count } = await db.from("doleances").select("*", { count: "exact", head: true });
console.log(`\n${inserees} doléances générées et insérées.`);
console.log("Répartition du lot :", parTheme);
console.log(`Total en base : ${count} doléances.`);
