"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { getFcSub } from "@/lib/citoyen";
import { FriseStatut } from "@/components/FriseStatut";
import { labelStatut, labelTheme } from "@/lib/statuts";

type Reponse = { texte: string; created_at: string; auteur: string };
type Doleance = {
  id: string;
  texte_anonymise: string;
  theme: string | null;
  urgence: string | null;
  resume: string | null;
  statut: string;
  created_at: string;
  elus: { nom: string; mandat: string } | null;
  reponses: Reponse[];
};

const couleurUrgence: Record<string, string> = {
  haute: "#e1000f",
  moyenne: "#b34000",
  faible: "#0063cb",
};

function dateFr(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SuiviPage() {
  const [doleances, setDoleances] = useState<Doleance[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch(`/api/mes-doleances?fc=${encodeURIComponent(getFcSub())}`)
      .then((r) => r.json())
      .then((d) => setDoleances(d.doleances ?? []))
      .catch(() => setDoleances([]))
      .finally(() => setChargement(false));
  }, []);

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Suivi de mes doléances</h1>
        <p className="fr-text--lead">
          Retrouvez ici toutes les demandes que vous avez déposées et leur état
          d’avancement, étape par étape.
        </p>

        {chargement ? (
          <p>Chargement…</p>
        ) : doleances.length === 0 ? (
          <div
            className="fr-card fr-card--no-border"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)", textAlign: "center" }}
          >
            <div className="fr-card__body fr-py-6w">
              <p className="fr-text--lead fr-mb-2w">
                Vous n’avez pas encore déposé de doléance.
              </p>
              <Link className="fr-btn" href="/deposer">
                Déposer ma première doléance
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {doleances.map((d) => (
              <article
                key={d.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderLeft: `4px solid ${couleurUrgence[d.urgence ?? "faible"] ?? "#0063cb"}`,
                  borderRadius: 8,
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        background: "#eeeeff",
                        color: "#000091",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    >
                      {labelTheme(d.theme)}
                    </span>
                    <p style={{ margin: 0, fontSize: 15 }}>
                      {d.resume || d.texte_anonymise}
                    </p>
                  </div>
                  <span style={{ fontSize: 13, color: "#666", whiteSpace: "nowrap" }}>
                    n° {d.id.slice(0, 8)}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#666", margin: "8px 0 4px" }}>
                  Déposée le {dateFr(d.created_at)}
                  {d.elus ? ` · transmise à ${d.elus.nom} (${d.elus.mandat})` : ""}
                </div>

                <FriseStatut statut={d.statut} />

                {d.reponses.length > 0 && (
                  <div
                    style={{
                      marginTop: "1rem",
                      background: "#f0f8f4",
                      borderLeft: "3px solid #18753c",
                      borderRadius: "0 4px 4px 0",
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontWeight: 700,
                        color: "#18753c",
                        fontSize: 14,
                      }}
                    >
                      Réponse de {d.reponses[0].auteur} — statut : {labelStatut(d.statut)}
                    </p>
                    <p style={{ margin: 0, fontSize: 14 }}>{d.reponses[0].texte}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="fr-mt-4w">
          <Link className="fr-btn fr-btn--secondary" href="/deposer">
            Déposer une nouvelle doléance
          </Link>
        </div>
      </main>
    </>
  );
}
