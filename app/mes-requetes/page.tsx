"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { SelecteurTerritoire } from "@/components/SelecteurTerritoire";
import { BarreFiltres } from "@/components/BarreFiltres";
import { StatutBadge } from "@/components/StatutBadge";
import { getElu, type EluSession } from "@/lib/elu";
import { labelTheme } from "@/lib/statuts";
import type { Territoire } from "@/lib/territoire";

type Reponse = { texte: string; created_at: string; auteur: string };
type Doleance = {
  id: string;
  texte_anonymise: string;
  theme: string | null;
  urgence: string | null;
  resume: string | null;
  statut: string;
  code_insee: string;
  created_at: string;
  reponses: Reponse[];
};

export default function MesRequetesPage() {
  const router = useRouter();
  const [elu, setEluState] = useState<EluSession | null>(null);
  const [territoire, setTerritoire] = useState<Territoire | null>(null);
  const [doleances, setDoleances] = useState<Doleance[]>([]);
  const [chargement, setChargement] = useState(true);
  const [reponseEnCours, setReponseEnCours] = useState<Record<string, string>>({});
  const [envoiId, setEnvoiId] = useState<string | null>(null);
  const [ftheme, setFtheme] = useState("");
  const [fstatut, setFstatut] = useState("");

  useEffect(() => {
    const e = getElu();
    if (!e) {
      router.push("/espace-elu");
      return;
    }
    setEluState(e);
    setTerritoire({ niveau: e.niveauTerr, code: e.code, nom: e.territoireNom });
  }, [router]);

  const charger = useCallback(async (t: Territoire) => {
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
  }, []);

  useEffect(() => {
    if (territoire) charger(territoire);
  }, [territoire, charger]);

  const stats = useMemo(() => {
    const total = doleances.length;
    const enCours = doleances.filter((d) => d.statut === "en_traitement").length;
    const repondues = doleances.filter((d) => d.statut === "repondue").length;
    return { total, enCours, repondues };
  }, [doleances]);

  const affichees = useMemo(
    () =>
      doleances.filter(
        (d) => (!ftheme || d.theme === ftheme) && (!fstatut || d.statut === fstatut)
      ),
    [doleances, ftheme, fstatut]
  );

  const envoyerReponse = async (id: string) => {
    const texte = (reponseEnCours[id] ?? "").trim();
    if (!texte || !elu) return;
    setEnvoiId(id);
    try {
      const r = await fetch("/api/reponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doleance_id: id, texte, auteur: elu.label }),
      });
      const d = await r.json();
      if (d.ok) {
        setDoleances((cur) =>
          cur.map((x) =>
            x.id === id
              ? {
                  ...x,
                  statut: "repondue",
                  reponses: [{ texte, created_at: new Date().toISOString(), auteur: elu.label }],
                }
              : x
          )
        );
        setReponseEnCours((cur) => ({ ...cur, [id]: "" }));
      }
    } finally {
      setEnvoiId(null);
    }
  };

  if (!elu) return null;

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        {/* En-tête élu, avec photo si disponible */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            background: "#f5f5fe",
            border: "1px solid #e3e3fd",
            borderRadius: 8,
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {elu.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={elu.photo}
              alt={elu.label}
              style={{
                width: 72,
                height: 90,
                objectFit: "cover",
                borderRadius: 6,
                border: "2px solid #000091",
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#000091",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              {elu.label
                .split(" ")
                .map((m) => m[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>{elu.label}</h1>
            <p style={{ margin: "2px 0 0", color: "#3a3a3a" }}>{elu.mandat}</p>
            <p style={{ margin: "2px 0 0", color: "#666", fontSize: 14 }}>
              Territoire : {elu.territoireNom}
            </p>
          </div>
        </div>

        {/* KPI */}
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
          {[
            { label: "Doléances reçues", val: stats.total },
            { label: "En traitement", val: stats.enCours },
            { label: "Répondues", val: stats.repondues },
          ].map((k) => (
            <div key={k.label} className="fr-col-6 fr-col-md-4">
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  padding: "1rem 1.25rem",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{k.label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#000091" }}>
                  {k.val}
                </p>
              </div>
            </div>
          ))}
        </div>

        <details className="fr-mb-3w">
          <summary style={{ cursor: "pointer", color: "#000091" }}>
            Changer de territoire
          </summary>
          <div className="fr-mt-2w">
            <SelecteurTerritoire
              value={territoire}
              onChange={(t) => t && setTerritoire(t)}
              autoriserNational
            />
          </div>
        </details>

        <h2 className="fr-h4">Doléances à traiter</h2>
        {doleances.length > 0 && (
          <BarreFiltres
            theme={ftheme}
            statut={fstatut}
            onTheme={setFtheme}
            onStatut={setFstatut}
          />
        )}
        {chargement ? (
          <p>Chargement…</p>
        ) : affichees.length === 0 ? (
          <p>Aucune doléance ne correspond à ces critères.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {affichees.map((d) => (
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
                    {d.urgence === "haute" ? " · urgent" : ""}
                  </span>
                  <StatutBadge statut={d.statut} />
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 15 }}>{d.texte_anonymise}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                  Commune {d.code_insee}
                </p>

                {d.reponses.length > 0 ? (
                  <div
                    style={{
                      marginTop: 10,
                      background: "#f0f8f4",
                      borderLeft: "3px solid #18753c",
                      padding: "0.5rem 0.75rem",
                      fontSize: 14,
                    }}
                  >
                    <strong style={{ color: "#18753c" }}>Réponse envoyée :</strong>{" "}
                    {d.reponses[0].texte}
                  </div>
                ) : (
                  <div className="fr-mt-2w">
                    <textarea
                      className="fr-input"
                      rows={2}
                      placeholder="Rédiger une réponse au citoyen…"
                      value={reponseEnCours[d.id] ?? ""}
                      onChange={(e) =>
                        setReponseEnCours((cur) => ({ ...cur, [d.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="fr-btn fr-btn--sm fr-mt-1w"
                      disabled={envoiId === d.id}
                      onClick={() => envoyerReponse(d.id)}
                    >
                      {envoiId === d.id ? "Envoi…" : "Répondre et clôturer"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
