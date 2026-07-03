import { askClaudeJSON, claudeDisponible } from "./claude";
import { supabaseAdmin } from "./supabase";
import {
  PROMPT_ANONYMISATION,
  PROMPT_CLASSIFICATION,
  PROMPT_ROUTING,
} from "./prompts";

export type Urgence = "faible" | "moyenne" | "haute";
export type Niveau = "commune" | "departement" | "region" | "etat";

export type ResultatPipeline = {
  texte_anonymise: string;
  theme: string;
  urgence: Urgence;
  resume: string;
  niveau: Niveau;
  justification: string;
  mode: "claude" | "secours";
};

// ---------------------------------------------------------------------------
// MODE SECOURS : règles simples, zéro appel réseau. Garantit une démo qui
// fonctionne de bout en bout sans clé Anthropic (ou sans wifi). Dès que
// ANTHROPIC_API_KEY est renseignée dans .env.local, Claude prend le relais.
// ---------------------------------------------------------------------------

function anonymiserSecours(texte: string): string {
  return texte
    .replace(/(\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/g, "[téléphone]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]");
}

const THEMES_SECOURS: [string, RegExp][] = [
  ["transports", /\b(rer|transilien|ter|m[ée]tro|bus|tram|train|gare)\b/i],
  ["education", /\b(coll[èe]ge|lyc[ée]e|cantine|classe|[ée]cole)\b/i],
  ["sante", /\b(m[ée]decin|h[ôo]pital|urgences|sant[ée]|ophtalmo|infirmi)\b/i],
  ["logement", /\b(logement|loyer|hlm|bailleur|immeuble|ascenseur)\b/i],
  ["securite", /\b([ée]clairage|agress|rod[ée]o|vol|cambriol|police|incendie)\b/i],
  ["environnement", /\b(poubelle|d[ée]chet|pollution|parc|square|bruit)\b/i],
  ["voirie", /\b(trou|chauss[ée]e|trottoir|passage pi[ée]ton|stationnement|feu (rouge|vert|pi[ée]ton))\b/i],
];

const NIVEAU_PAR_THEME: Record<string, Niveau> = {
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

const JUSTIFICATIONS: Record<Niveau, string> = {
  commune: "Votre demande relève de la compétence de votre mairie.",
  departement: "Votre demande relève du conseil départemental (collèges, routes départementales, aide sociale).",
  region: "Votre demande relève du conseil régional (lycées, transports régionaux).",
  etat: "Votre demande relève de l'État : elle sera réorientée vers l'organisme compétent (ex. ARS).",
};

function pipelineSecours(texte: string): ResultatPipeline {
  const texte_anonymise = anonymiserSecours(texte);
  const theme =
    THEMES_SECOURS.find(([, re]) => re.test(texte))?.[0] ?? "autres";
  let niveau = NIVEAU_PAR_THEME[theme];
  if (theme === "education" && /coll[èe]ge|cantine/i.test(texte)) {
    niveau = "departement";
  }
  const urgence: Urgence = /danger|renvers|insalubr|agress|failli|inond/i.test(
    texte
  )
    ? "haute"
    : "moyenne";
  const resume =
    texte_anonymise.split(/\s+/).slice(0, 14).join(" ") +
    (texte_anonymise.split(/\s+/).length > 14 ? "…" : "");
  return {
    texte_anonymise,
    theme,
    urgence,
    resume,
    niveau,
    justification: JUSTIFICATIONS[niveau],
    mode: "secours",
  };
}

// ---------------------------------------------------------------------------
// PIPELINE PRINCIPAL : anonymisation → classification → routing
// ---------------------------------------------------------------------------

export async function runPipeline(
  texte: string,
  code_insee: string
): Promise<ResultatPipeline> {
  if (claudeDisponible()) {
    try {
      const a = await askClaudeJSON<{ texte_anonymise: string }>(
        PROMPT_ANONYMISATION,
        texte
      );
      const c = await askClaudeJSON<{
        theme: string;
        urgence: Urgence;
        resume: string;
      }>(PROMPT_CLASSIFICATION, a.texte_anonymise);
      const r = await askClaudeJSON<{
        niveau: Niveau;
        organisme: string | null;
        justification: string;
      }>(
        PROMPT_ROUTING,
        JSON.stringify({ texte: a.texte_anonymise, theme: c.theme, code_insee })
      );
      return {
        texte_anonymise: a.texte_anonymise,
        theme: c.theme,
        urgence: c.urgence,
        resume: c.resume,
        niveau: r.niveau,
        justification:
          r.organisme && r.organisme !== "null"
            ? `${r.justification} (réorienté : ${r.organisme})`
            : r.justification,
        mode: "claude",
      };
    } catch {
      // Claude indisponible (réseau, quota…) : on bascule en secours.
    }
  }
  return pipelineSecours(texte);
}

// Sélection de l'élu destinataire dans la table elus (RNE importé :
// ~34 600 maires, 577 députés, présidents de départements et de régions).
// Région codée en dur sur l'Île-de-France ('11') — mapping dept → région
// à brancher si la démo sort d'IDF.
export async function choisirElu(niveau: Niveau, code_insee: string) {
  const db = supabaseAdmin();
  const dept =
    code_insee.startsWith("97") || code_insee.startsWith("98")
      ? code_insee.slice(0, 3)
      : code_insee.slice(0, 2);
  const chercher = async (niv: string, terr: string) =>
    (
      await db
        .from("elus")
        .select("id, nom, mandat, niveau")
        .eq("niveau", niv)
        .eq("territoire_code", terr)
        .limit(1)
    ).data?.[0] ?? null;

  const cible =
    niveau === "commune" ? code_insee
    : niveau === "departement" || niveau === "etat" ? dept
    : "11";
  let elu = await chercher(niveau, cible);
  if (!elu) elu = await chercher("region", "11");
  return elu;
}
