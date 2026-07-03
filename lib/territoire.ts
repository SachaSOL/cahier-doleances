// Aide au filtrage des doléances par territoire (côté serveur).
// niveau national = toute la France ; region = tous les départements de la
// région (via geo.api.gouv.fr) ; departement = préfixe INSEE ; commune = INSEE exact.

export type NiveauTerr = "national" | "region" | "departement" | "commune";

export type Territoire = {
  niveau: NiveauTerr;
  code: string; // "" pour national
  nom: string;
};

const cacheDepts = new Map<string, string[]>();
const cacheCommunes = new Map<string, Map<string, string>>();

// Code INSEE → nom de commune pour un département (mémoïsé).
export async function communesDuDepartement(dept: string): Promise<Map<string, string>> {
  if (cacheCommunes.has(dept)) return cacheCommunes.get(dept)!;
  try {
    const r = await fetch(
      `https://geo.api.gouv.fr/departements/${dept}/communes?fields=code,nom`
    );
    const j = (await r.json()) as { code: string; nom: string }[];
    const m = new Map(j.map((c) => [c.code, c.nom]));
    cacheCommunes.set(dept, m);
    return m;
  } catch {
    return new Map();
  }
}

// Déduit le code département d'un code INSEE (gère la Corse et l'outre-mer).
export function deptDeInsee(insee: string): string {
  if (insee.startsWith("2A") || insee.startsWith("2B")) return insee.slice(0, 2);
  if (insee.startsWith("97") || insee.startsWith("98")) return insee.slice(0, 3);
  return insee.slice(0, 2);
}

export async function departementsDeRegion(codeRegion: string): Promise<string[]> {
  if (cacheDepts.has(codeRegion)) return cacheDepts.get(codeRegion)!;
  try {
    const r = await fetch(
      `https://geo.api.gouv.fr/regions/${codeRegion}/departements?fields=code`
    );
    const j = (await r.json()) as { code: string }[];
    const codes = j.map((d) => d.code);
    cacheDepts.set(codeRegion, codes);
    return codes;
  } catch {
    return [];
  }
}

// Applique le filtre territorial à une requête supabase-js sur « doleances ».
export async function appliquerFiltre<T>(
  query: T & {
    eq: (c: string, v: string) => T;
    like: (c: string, v: string) => T;
    or: (f: string) => T;
  },
  niveau: NiveauTerr,
  code: string
): Promise<T> {
  if (niveau === "commune" && code) return query.eq("code_insee", code);
  if (niveau === "departement" && code)
    return query.like("code_insee", `${code}%`);
  if (niveau === "region" && code) {
    const depts = await departementsDeRegion(code);
    if (depts.length > 0) {
      return query.or(depts.map((d) => `code_insee.like.${d}%`).join(","));
    }
  }
  return query; // national : aucun filtre
}
