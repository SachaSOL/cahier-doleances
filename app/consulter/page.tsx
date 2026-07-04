"use client";

import { useMemo, useState } from "react";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { SelecteurTerritoire } from "@/components/SelecteurTerritoire";
import { CarteFrance } from "@/components/CarteFrance";
import { BarreFiltres } from "@/components/BarreFiltres";
import { StatutBadge } from "@/components/StatutBadge";
import { labelTheme } from "@/lib/statuts";
import type { Territoire } from "@/lib/territoire";

type Reponse = { texte: string; created_at: string; auteur: string };
type Doleance = {
  id: string;
  texte_anonymise: string;
  theme: string | null;
  statut: string;
  created_at: string;
  code_insee: string;
  commune_nom: string | null;
  elus: { nom: string; mandat: string; niveau: string } | null;
  reponses: Reponse[];
};

// Phrase indiquant qui a reçu / traité la doléance, selon le statut.
function destinataire(d: Doleance): string | null {
  if (!d.elus) return null;
  const lieu = d.commune_nom ? ` à ${d.commune_nom}` : "";
  const qui = `${d.elus.nom}, ${d.elus.mandat}${lieu}`;
  if (d.statut === "repondue") return `Traitée par ${qui}`;
  if (d.statut === "deposee") return `Sera transmise à ${qui}`;
  return `Transmise à ${qui}`;
}

export default function ConsulterPage() {
  const [territoire, setTerritoire] = useState<Territoire | null>(null);
  const [doleances, setDoleances] = useState<Doleance[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [ftheme, setFtheme] = useState("");
  const [fstatut, setFstatut] = useState("");
  const [ouvertes, setOuvertes] = useState<Record<string, boolean>>({});
  const [survol, setSurvol] = useState<string | null>(null);
  const [mode, setMode] = useState<"carte" | "recherche">("carte");

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

  const filtrees = useMemo(() => {
    if (!doleances) return [];
    return doleances.filter(
      (d) =>
        (!ftheme || d.theme === ftheme) && (!fstatut || d.statut === fstatut)
    );
  }, [doleances, ftheme, fstatut]);

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

        {/* Choix du mode : carte interactive ou recherche */}
        <div className="fr-btns-group fr-btns-group--inline-md fr-mb-2w">
          <button
            type="button"
            className={mode === "carte" ? "fr-btn fr-btn--sm" : "fr-btn fr-btn--sm fr-btn--secondary"}
            onClick={() => setMode("carte")}
          >
            Carte de France
          </button>
          <button
            type="button"
            className={mode === "recherche" ? "fr-btn fr-btn--sm" : "fr-btn fr-btn--sm fr-btn--secondary"}
            onClick={() => setMode("recherche")}
          >
            Recherche par nom
          </button>
        </div>

        {mode === "carte" ? (
          <CarteFrance
            onCommune={(insee, nom) =>
              rechercher({ niveau: "commune", code: insee, nom })
            }
          />
        ) : (
          <SelecteurTerritoire value={territoire} onChange={rechercher} />
        )}

        {doleances !== null && doleances.length > 0 && (
          <div className="fr-mt-3w">
            <BarreFiltres
              theme={ftheme}
              statut={fstatut}
              onTheme={setFtheme}
              onStatut={setFstatut}
            />
          </div>
        )}

        <div className="fr-mt-2w">
          {chargement && <p>Chargement…</p>}
          {!chargement && doleances !== null && doleances.length === 0 && (
            <p>Aucune doléance trouvée pour ce territoire.</p>
          )}
          {!chargement && doleances !== null && doleances.length > 0 && (
            <>
              <p className="fr-text--sm">
                <strong>{filtrees.length}</strong> doléance
                {filtrees.length > 1 ? "s" : ""} affichée
                {filtrees.length > 1 ? "s" : ""}
                {territoire ? ` pour ${territoire.nom}` : ""}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {filtrees.map((d) => {
                  const ouverte = !!ouvertes[d.id];
                  const repondue = d.reponses.length > 0;
                  return (
                    <article
                      key={d.id}
                      onClick={() => setOuvertes((o) => ({ ...o, [d.id]: !o[d.id] }))}
                      onMouseEnter={() => setSurvol(d.id)}
                      onMouseLeave={() => setSurvol(null)}
                      style={{
                        background: survol === d.id ? "#f5f5fe" : "#fff",
                        border: "1px solid #e5e5e5",
                        borderRadius: 8,
                        padding: "1rem 1.25rem",
                        cursor: "pointer",
                        transition: "background 0.12s, box-shadow 0.12s",
                        boxShadow: survol === d.id ? "0 2px 10px rgba(0,0,145,0.12)" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "1rem",
                          flexWrap: "wrap",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            background: "#eeeeff",
                            color: "#000091",
                            fontSize: 13,
                            fontWeight: 700,
                            padding: "3px 12px",
                            borderRadius: 4,
                          }}
                        >
                          {labelTheme(d.theme)}
                        </span>
                        <StatutBadge statut={d.statut} />
                      </div>

                      <p style={{ margin: 0, fontSize: 15 }}>
                        {ouverte
                          ? d.texte_anonymise
                          : d.texte_anonymise.length > 140
                            ? d.texte_anonymise.slice(0, 140) + "…"
                            : d.texte_anonymise}
                      </p>

                      {destinataire(d) && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: 13,
                            color: "#3a3a3a",
                          }}
                        >
                          <span aria-hidden="true">📩 </span>
                          {destinataire(d)}
                        </p>
                      )}

                      {repondue && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: 13,
                            color: "#18753c",
                            fontWeight: 500,
                          }}
                        >
                          {ouverte ? "▼ Réponse ci-dessous" : "▶ Cliquer pour voir la réponse apportée"}
                        </p>
                      )}

                      {ouverte && repondue && (
                        <div
                          style={{
                            marginTop: 10,
                            background: "#f0f8f4",
                            borderLeft: "3px solid #18753c",
                            padding: "0.75rem 1rem",
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
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
