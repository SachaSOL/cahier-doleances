"use client";

import { useEffect, useRef, useState } from "react";
import type { NiveauTerr, Territoire } from "@/lib/territoire";

// Sélecteur de territoire couvrant TOUTE la France : régions, départements,
// communes, avec recherche (autocomplétion via geo.api.gouv.fr).
type Suggestion = { code: string; nom: string; contexte?: string };

const TYPES: { niveau: NiveauTerr; label: string }[] = [
  { niveau: "commune", label: "Commune" },
  { niveau: "departement", label: "Département" },
  { niveau: "region", label: "Région" },
];

export function SelecteurTerritoire({
  value,
  onChange,
  autoriserNational = false,
}: {
  value: Territoire | null;
  onChange: (t: Territoire | null) => void;
  autoriserNational?: boolean;
}) {
  const [niveau, setNiveau] = useState<NiveauTerr>(
    value?.niveau && value.niveau !== "national" ? value.niveau : "commune"
  );
  const [q, setQ] = useState(value?.nom ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        let url = "";
        if (niveau === "commune")
          url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
            q
          )}&fields=code,nom,departement&boost=population&limit=8`;
        else if (niveau === "departement")
          url = `https://geo.api.gouv.fr/departements?nom=${encodeURIComponent(
            q
          )}&limit=8`;
        else
          url = `https://geo.api.gouv.fr/regions?nom=${encodeURIComponent(q)}`;

        const r = await fetch(url);
        const j = await r.json();
        const items: Suggestion[] = (Array.isArray(j) ? j : []).map(
          (d: { code: string; nom: string; departement?: { nom: string } }) => ({
            code: d.code,
            nom: d.nom,
            contexte: d.departement?.nom,
          })
        );
        setSuggestions(items);
        setOuvert(true);
      } catch {
        setSuggestions([]);
      }
    }, 220);
  }, [q, niveau]);

  const choisir = (s: Suggestion) => {
    setQ(s.nom);
    setOuvert(false);
    onChange({ niveau, code: s.code, nom: s.nom });
  };

  return (
    <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
      <div className="fr-col-12 fr-col-md-4">
        <label className="fr-label" htmlFor="sel-type">
          Type de territoire
        </label>
        <select
          className="fr-select"
          id="sel-type"
          value={niveau}
          onChange={(e) => {
            setNiveau(e.target.value as NiveauTerr);
            setQ("");
            setSuggestions([]);
            onChange(null);
          }}
        >
          {TYPES.map((t) => (
            <option key={t.niveau} value={t.niveau}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="fr-col-12 fr-col-md-6" style={{ position: "relative" }}>
        <label className="fr-label" htmlFor="sel-terr">
          Rechercher un territoire
        </label>
        <input
          className="fr-input"
          id="sel-terr"
          type="text"
          autoComplete="off"
          placeholder={
            niveau === "commune"
              ? "Ex. : Marseille, Trouville…"
              : niveau === "departement"
                ? "Ex. : Gironde, Rhône…"
                : "Ex. : Occitanie, Bretagne…"
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOuvert(true)}
        />
        {ouvert && suggestions.length > 0 && (
          <ul
            style={{
              position: "absolute",
              zIndex: 50,
              left: 12,
              right: 12,
              margin: 0,
              padding: 0,
              listStyle: "none",
              background: "#fff",
              border: "1px solid #ddd",
              borderTop: "none",
              maxHeight: 260,
              overflowY: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            {suggestions.map((s) => (
              <li key={`${s.code}-${s.nom}`}>
                <button
                  type="button"
                  onClick={() => choisir(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  {s.nom}
                  {s.contexte ? (
                    <span style={{ color: "#666" }}> — {s.contexte}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {autoriserNational && (
        <div className="fr-col-12 fr-col-md-2">
          <button
            type="button"
            className="fr-btn fr-btn--secondary fr-btn--sm"
            onClick={() => {
              setQ("");
              setSuggestions([]);
              onChange({ niveau: "national", code: "", nom: "France entière" });
            }}
          >
            France entière
          </button>
        </div>
      )}
    </div>
  );
}
