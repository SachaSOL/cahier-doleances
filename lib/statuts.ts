// Statuts de la base → libellé + étape (0..3) pour la frise de suivi.
export type StatutDB = "deposee" | "transmise" | "en_traitement" | "repondue";

export const STATUTS: { db: StatutDB; label: string }[] = [
  { db: "deposee", label: "Déposée" },
  { db: "transmise", label: "Transmise" },
  { db: "en_traitement", label: "En traitement" },
  { db: "repondue", label: "Répondue" },
];

export function etapeDe(statut: string): number {
  const i = STATUTS.findIndex((s) => s.db === statut);
  return i < 0 ? 0 : i;
}

export function labelStatut(statut: string): string {
  return STATUTS.find((s) => s.db === statut)?.label ?? statut;
}

export const THEME_LABELS: Record<string, string> = {
  transports: "Transports",
  logement: "Logement",
  education: "Éducation",
  sante: "Santé",
  securite: "Sécurité",
  environnement: "Environnement",
  voirie: "Voirie",
  services_publics: "Services publics",
  autres: "Autres",
};

export function labelTheme(t: string | null): string {
  if (!t) return "Autres";
  return THEME_LABELS[t] ?? t;
}

// Couleur par thème (palette officielle DSFR), pour le graphe et les pastilles.
export const THEME_COLORS: Record<string, string> = {
  transports: "#6A6AF4",
  logement: "#465F9D",
  education: "#00A95F",
  sante: "#E1000F",
  securite: "#FF5D00",
  environnement: "#297254",
  voirie: "#8A5C2E",
  services_publics: "#A558A0",
  autres: "#929292",
};

export function couleurTheme(t: string | null): string {
  if (!t) return THEME_COLORS.autres;
  return THEME_COLORS[t] ?? THEME_COLORS.autres;
}
