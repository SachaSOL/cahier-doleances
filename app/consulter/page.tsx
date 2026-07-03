"use client";

import { useState } from "react";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { SelecteurTerritoire } from "@/components/SelecteurTerritoire";
import { labelStatut, labelTheme } from "@/lib/statuts";
import type { Territoire } from "@/lib/territoire";

type Reponse = { texte: string; created_at: string; auteur: string };
type Doleance = {
  id: string;
  texte_anonymise: string;
  theme: string | null;
  statut: string;
  created_at: string;
  code_insee: string;
  reponses: Reponse[];
};

const couleurStatut: Record<string, string> = {
  deposee: "#0063cb",
  transmise: "#6a6af4",
  en_traitement: "#b34000",
  repondue: "#18753c",
};

export default function ConsulterPage() {
  const [territoire, setTerritoire] = useState<Territoire | null>(null);
  const [doleances, setDoleances] = useState<Doleance[] | null>(null);
  const [chargement, setChargement] = useState(false);

  const rechercher = async (t: Territoire | null) => {
    setTerritoire(t);
    if (!t) return;
    setChargement(true);
    try {
      const r = await fetch(
        `/api/doleances?niveau=${t.niveau}&code=${encodeURIComponent(t.code)}`
      );
      const d = await r.json();
      setDoleances(d.doleances ?? []);
    } catch {
      setDoleances([]);
    }
    setChargement(false);
  };

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Consulter les doléances par territoire</h1>
        <p className="fr-text--lead">
          Choisissez une commune, un département ou une région pour voir les
          doléances déposées et les réponses apportées.
        </p>

        <div className="fr-callout fr-callout--blue-cumulus fr-mb-3w">
          <p className="fr-callout__text fr-text--sm">
            Confidentialité : les doléances sont affichées de façon anonyme. Ni
            le nom, ni l’adresse des personnes ne sont jamais visibles.
          </p>
        </div>

        <SelecteurTerritoire value={territoire} onChange={rechercher} />

        <div className="fr-mt-4w">
          {chargement && <p>Chargement…</p>}
          {!chargement && doleances !== null && doleances.length === 0 && (
            <p>Aucune doléance trouvée pour ce territoire.</p>
          )}
          {!chargement && doleances !== null && doleances.length > 0 && (
            <>
              <p className="fr-text--sm">
                <strong>{doleances.length}</strong> doléance
                {doleances.length > 1 ? "s" : ""} pour {territoire?.nom}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {doleances.map((d) => (
                  <article
                    key={d.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: 8,
                      padding: "1rem 1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          background: "#eeeeff",
                          color: "#000091",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "2px 10px",
                          borderRadius: 4,
                        }}
                      >
                        {labelTheme(d.theme)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: couleurStatut[d.statut] ?? "#666",
                        }}
                      >
                        {labelStatut(d.statut)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 15 }}>{d.texte_anonymise}</p>
                    {d.reponses.length > 0 && (
                      <div
                        style={{
                          marginTop: 10,
                          background: "#f0f8f4",
                          borderLeft: "3px solid #18753c",
                          padding: "0.5rem 0.75rem",
                          fontSize: 14,
                        }}
                      >
                        <strong style={{ color: "#18753c" }}>
                          Réponse de {d.reponses[0].auteur} :
                        </strong>{" "}
                        {d.reponses[0].texte}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
