"use client";

import { STATUTS, THEME_LABELS } from "@/lib/statuts";

// Deux menus déroulants (thème + statut) — valeurs proposées, jamais à saisir.
export function BarreFiltres({
  theme,
  statut,
  onTheme,
  onStatut,
}: {
  theme: string;
  statut: string;
  onTheme: (v: string) => void;
  onStatut: (v: string) => void;
}) {
  return (
    <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
      <div className="fr-col-6 fr-col-md-4">
        <label className="fr-label" htmlFor="filtre-theme">
          Filtrer par thème
        </label>
        <select
          className="fr-select"
          id="filtre-theme"
          value={theme}
          onChange={(e) => onTheme(e.target.value)}
        >
          <option value="">Tous les thèmes</option>
          {Object.entries(THEME_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="fr-col-6 fr-col-md-4">
        <label className="fr-label" htmlFor="filtre-statut">
          Filtrer par statut
        </label>
        <select
          className="fr-select"
          id="filtre-statut"
          value={statut}
          onChange={(e) => onStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s.db} value={s.db}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
