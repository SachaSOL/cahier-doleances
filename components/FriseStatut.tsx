"use client";

import { STATUTS, etapeDe } from "@/lib/statuts";

// Libellés courts (une seule ligne, même sur écran étroit).
const COURTS = ["Déposée", "Transmise", "Traitement", "Répondue"];

// Frise horizontale à 4 étapes qui montre clairement où en est la doléance.
export function FriseStatut({ statut }: { statut: string }) {
  const etape = etapeDe(statut);
  return (
    <ol
      style={{
        display: "flex",
        listStyle: "none",
        padding: 0,
        margin: "0.5rem 0 0",
        gap: 0,
      }}
    >
      {STATUTS.map((s, i) => {
        const fait = i <= etape;
        const actif = i === etape;
        return (
          <li
            key={s.db}
            style={{
              flex: 1,
              textAlign: "center",
              position: "relative",
              minWidth: 0,
            }}
          >
            {i > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 11,
                  left: "-50%",
                  width: "100%",
                  height: 3,
                  background: fait ? "#000091" : "#dddddd",
                }}
                aria-hidden="true"
              />
            )}
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: fait ? "#000091" : "#eeeeee",
                color: fait ? "#fff" : "#666",
                fontSize: 13,
                fontWeight: 700,
                border: actif ? "3px solid #6a6af4" : "none",
                zIndex: 1,
              }}
            >
              {fait ? "✓" : i + 1}
            </span>
            <span
              style={{
                display: "block",
                fontSize: 11,
                lineHeight: 1.2,
                marginTop: 4,
                color: actif ? "#000091" : "#666",
                fontWeight: actif ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {COURTS[i]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
