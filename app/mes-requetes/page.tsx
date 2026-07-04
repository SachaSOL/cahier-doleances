"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { SelecteurTerritoire } from "@/components/SelecteurTerritoire";
import { StatutBadge } from "@/components/StatutBadge";
import { getElu, type EluSession } from "@/lib/elu";
import { labelTheme, couleurTheme } from "@/lib/statuts";
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
  commune_nom: string | null;
  created_at: string;
  reponses: Reponse[];
};

// Affiche le nombre de doléances au milieu de chaque part du camembert.
type LabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  value: number;
};
function renderCompteur({ cx, cy, midAngle, innerRadius, outerRadius, value }: LabelProps) {
  if (!value) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {value}
    </text>
  );
}

export default function MesRequetesPage() {
  const router = useRouter();
  const [elu, setEluState] = useState<EluSession | null>(null);
  const [territoire, setTerritoire] = useState<Territoire | null>(null);
  const [doleances, setDoleances] = useState<Doleance[]>([]);
  const [ageData, setAgeData] = useState<{ tranche: string; count: number }[]>([]);
  const [chargement, setChargement] = useState(true);

  // Panneau latéral (drawer) ouvert sur un thème.
  const [themeActif, setThemeActif] = useState<string | null>(null);
  const [reponseEnCours, setReponseEnCours] = useState<Record<string, string>>({});
  const [envoiId, setEnvoiId] = useState<string | null>(null);
  const [genId, setGenId] = useState<string | null>(null);

  // Mode sélection multiple.
  const [selection, setSelection] = useState(false);
  const [selectionnes, setSelectionnes] = useState<Set<string>>(new Set());
  const [survol, setSurvol] = useState<string | null>(null);
  const [reponseGroupee, setReponseGroupee] = useState("");
  const [envoiGroupe, setEnvoiGroupe] = useState(false);

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
      const a = await fetch(
        `/api/stats-age?niveau=${t.niveau}&code=${encodeURIComponent(t.code)}`
      ).then((x) => x.json());
      setAgeData(a.counts ?? []);
    } catch {
      setDoleances([]);
      setAgeData([]);
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    if (territoire) charger(territoire);
  }, [territoire, charger]);

  const stats = useMemo(() => {
    const total = doleances.length;
    const enCours = doleances.filter((d) => d.statut !== "repondue").length;
    const repondues = doleances.filter((d) => d.statut === "repondue").length;
    return { total, enCours, repondues };
  }, [doleances]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    doleances.forEach((d) => {
      const t = d.theme ?? "autres";
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, value]) => ({ key, label: labelTheme(key), value, color: couleurTheme(key) }))
      .sort((a, b) => b.value - a.value);
  }, [doleances]);

  // Signaux émergents : les couples (thème + commune) qui reviennent le plus.
  const signaux = useMemo(() => {
    const groupes: Record<string, { theme: string; commune: string; count: number }> = {};
    doleances.forEach((d) => {
      const theme = d.theme ?? "autres";
      const commune = d.commune_nom ?? d.code_insee;
      const cle = `${theme}|${commune}`;
      if (!groupes[cle]) groupes[cle] = { theme, commune, count: 0 };
      groupes[cle].count++;
    });
    return Object.values(groupes)
      .filter((g) => g.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [doleances]);

  const doleancesTheme = useMemo(
    () => doleances.filter((d) => (d.theme ?? "autres") === themeActif),
    [doleances, themeActif]
  );
  const aRepondreTheme = useMemo(
    () => doleancesTheme.filter((d) => d.statut !== "repondue"),
    [doleancesTheme]
  );

  const ouvrirTheme = (key: string) => {
    setThemeActif(key);
    setSelection(false);
    setSelectionnes(new Set());
    setReponseGroupee("");
  };
  const fermer = () => setThemeActif(null);

  const marquerRepondu = (ids: string[], texte: string) => {
    if (!elu) return;
    setDoleances((cur) =>
      cur.map((x) =>
        ids.includes(x.id)
          ? {
              ...x,
              statut: "repondue",
              reponses: [{ texte, created_at: new Date().toISOString(), auteur: elu.label }],
            }
          : x
      )
    );
  };

  // Passe une doléance « en cours de traitement » (étape intermédiaire visible
  // dans le suivi du citoyen), sans la clôturer.
  const marquerTraitement = async (id: string) => {
    const r = await fetch("/api/statut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doleance_id: id, statut: "en_traitement" }),
    });
    if ((await r.json()).ok) {
      setDoleances((cur) =>
        cur.map((x) => (x.id === id ? { ...x, statut: "en_traitement" } : x))
      );
    }
  };

  // Génère un brouillon de réponse (IA) et le place dans le champ, éditable.
  const genererReponse = async (id: string, texteDoleance: string) => {
    setGenId(id);
    try {
      const r = await fetch("/api/generer-reponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: texteDoleance }),
      });
      const d = await r.json();
      if (d.ok && d.reponse) {
        setReponseEnCours((cur) => ({ ...cur, [id]: d.reponse }));
      }
    } finally {
      setGenId(null);
    }
  };

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
      if ((await r.json()).ok) {
        marquerRepondu([id], texte);
        setReponseEnCours((cur) => ({ ...cur, [id]: "" }));
      }
    } finally {
      setEnvoiId(null);
    }
  };

  const envoyerGroupe = async () => {
    const ids = [...selectionnes];
    const texte = reponseGroupee.trim();
    if (ids.length === 0 || !texte || !elu) return;
    setEnvoiGroupe(true);
    try {
      const r = await fetch("/api/reponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doleance_ids: ids, texte, auteur: elu.label }),
      });
      if ((await r.json()).ok) {
        marquerRepondu(ids, texte);
        setSelectionnes(new Set());
        setReponseGroupee("");
        setSelection(false);
      }
    } finally {
      setEnvoiGroupe(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectionnes((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  if (!elu) return null;

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        {/* En-tête élu */}
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
              style={{ width: 72, height: 90, objectFit: "cover", borderRadius: 6, border: "2px solid #000091" }}
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
              {elu.label.split(" ").map((m) => m[0]).slice(0, 2).join("")}
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
            { label: "À traiter", val: stats.enCours },
            { label: "Répondues", val: stats.repondues },
          ].map((k) => (
            <div key={k.label} className="fr-col-6 fr-col-md-4">
              <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, padding: "1rem 1.25rem" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{k.label}</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#000091" }}>{k.val}</p>
              </div>
            </div>
          ))}
        </div>

        {signaux.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderLeft: "4px solid #b34000",
              borderRadius: 8,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <h2 style={{ margin: "0 0 4px", fontSize: 16 }}>
              <span aria-hidden="true">📈 </span>Signaux émergents
            </h2>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "#666" }}>
              Les problèmes qui reviennent le plus sur votre territoire — à
              regarder en priorité.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {signaux.map((s) => (
                <button
                  key={`${s.theme}-${s.commune}`}
                  type="button"
                  onClick={() => ouvrirTheme(s.theme)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f5f5fe",
                    border: "1px solid #e3e3fd",
                    borderRadius: 999,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#b34000" }}>{s.count}×</span>
                  <span>
                    {labelTheme(s.theme)} · {s.commune}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <details className="fr-mb-3w">
          <summary style={{ cursor: "pointer", color: "#000091" }}>Changer de territoire</summary>
          <div className="fr-mt-2w">
            <SelecteurTerritoire value={territoire} onChange={(t) => t && setTerritoire(t)} autoriserNational />
          </div>
        </details>

        {/* Graphe interactif */}
        <h2 className="fr-h4">Répartition des doléances par thème</h2>
        <p className="fr-text--sm" style={{ color: "#666", marginTop: "-0.5rem" }}>
          Cliquez sur une part du graphe pour voir les doléances de ce thème et y répondre.
        </p>

        {chargement ? (
          <p>Chargement…</p>
        ) : chartData.length === 0 ? (
          <p>Aucune doléance sur ce territoire.</p>
        ) : (
          <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
            <div className="fr-col-12 fr-col-md-6" style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 280, height: 280 }}>
              <PieChart width={280} height={280}>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={115}
                  paddingAngle={2}
                  isAnimationActive={false}
                  label={renderCompteur as never}
                  labelLine={false}
                  onClick={(d: unknown) => {
                    const e = d as { key?: string; payload?: { key?: string } };
                    const key = e?.key ?? e?.payload?.key;
                    if (key) ouvrirTheme(key);
                  }}
                  style={{ cursor: "pointer", outline: "none" }}
                >
                  {chartData.map((e) => (
                    <Cell key={e.key} fill={e.color} stroke="#fff" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v} doléances`} />
              </PieChart>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 700, color: "#000091" }}>
                  {stats.total}
                </span>
                <span style={{ fontSize: 12, color: "#666" }}>doléances</span>
              </div>
              </div>
            </div>
            <div className="fr-col-12 fr-col-md-6">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {chartData.map((e) => (
                  <li key={e.key}>
                    <button
                      type="button"
                      onClick={() => ouvrirTheme(e.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 10px",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = "#f0f0ff")}
                      onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}
                    >
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: e.color, flex: "none" }} />
                      <span style={{ flex: 1 }}>{e.label}</span>
                      <strong>{e.value}</strong>
                      <span style={{ color: "#000091", fontSize: 13 }}>Répondre ›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {ageData.length > 0 && (
          <div className="fr-mt-5w">
            <h2 className="fr-h4">Profil des citoyens par tranche d’âge</h2>
            <p className="fr-text--sm" style={{ color: "#666", marginTop: "-0.5rem" }}>
              Répartition anonyme des personnes ayant déposé une doléance sur ce
              territoire.
            </p>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={ageData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                  <XAxis dataKey="tranche" tick={{ fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v} doléances`} />
                  <Bar dataKey="count" fill="#000091" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      {/* Panneau latéral (drawer) */}
      {themeActif && (
        <>
          <div
            onClick={fermer}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000 }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(460px, 92vw)",
              background: "#fff",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #e5e5e5",
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 4, background: couleurTheme(themeActif) }} />
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{labelTheme(themeActif)}</h2>
                <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
                  {aRepondreTheme.length} à traiter · {doleancesTheme.length} au total
                </p>
              </div>
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer"
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {aRepondreTheme.length > 1 && (
              <div style={{ padding: "0.5rem 1.25rem", borderBottom: "1px solid #f0f0f0" }}>
                <button
                  type="button"
                  className={selection ? "fr-btn fr-btn--sm" : "fr-btn fr-btn--sm fr-btn--secondary"}
                  onClick={() => {
                    setSelection((s) => !s);
                    setSelectionnes(new Set());
                  }}
                >
                  {selection ? "Annuler la sélection" : "Sélectionner plusieurs doléances"}
                </button>
                {selection && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#666" }}>
                    Cliquez sur les doléances similaires pour les regrouper, puis répondez à toutes en une fois.
                  </p>
                )}
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem" }}>
              {doleancesTheme.map((d) => {
                const repondue = d.statut === "repondue";
                const selectionnable = selection && !repondue;
                const estSelectionne = selectionnes.has(d.id);
                return (
                  <article
                    key={d.id}
                    onClick={selectionnable ? () => toggleSelection(d.id) : undefined}
                    onMouseEnter={() => setSurvol(d.id)}
                    onMouseLeave={() => setSurvol(null)}
                    style={{
                      border: estSelectionne ? "2px solid #000091" : "1px solid #e5e5e5",
                      borderRadius: 8,
                      padding: "0.75rem 1rem",
                      marginBottom: 10,
                      cursor: selectionnable ? "pointer" : "default",
                      background:
                        estSelectionne
                          ? "#eef0ff"
                          : selectionnable && survol === d.id
                            ? "#f5f5fe"
                            : "#fff",
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#666" }}>Commune {d.code_insee}</span>
                      {selectionnable && (
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            border: "2px solid #000091",
                            background: estSelectionne ? "#000091" : "#fff",
                            color: "#fff",
                            fontSize: 13,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {estSelectionne ? "✓" : ""}
                        </span>
                      )}
                      {!selectionnable && <StatutBadge statut={d.statut} />}
                    </div>
                    <p style={{ margin: 0, fontSize: 14 }}>{d.texte_anonymise}</p>

                    {repondue ? (
                      <div
                        style={{
                          marginTop: 8,
                          background: "#f0f8f4",
                          borderLeft: "3px solid #18753c",
                          padding: "0.5rem 0.75rem",
                          fontSize: 13,
                        }}
                      >
                        <strong style={{ color: "#18753c" }}>Réponse envoyée :</strong>{" "}
                        {d.reponses[0]?.texte}
                      </div>
                    ) : (
                      !selection && (
                        <div className="fr-mt-1w">
                          {d.statut !== "en_traitement" && (
                            <button
                              type="button"
                              className="fr-btn fr-btn--sm fr-btn--secondary"
                              style={{ marginBottom: 8 }}
                              onClick={() => marquerTraitement(d.id)}
                            >
                              Marquer « en cours de traitement »
                            </button>
                          )}
                          <div style={{ marginBottom: 6 }}>
                            <button
                              type="button"
                              className="fr-btn fr-btn--sm fr-btn--tertiary"
                              disabled={genId === d.id}
                              onClick={() => genererReponse(d.id, d.texte_anonymise)}
                            >
                              {genId === d.id ? "Rédaction en cours…" : "✨ Générer une réponse (IA)"}
                            </button>
                          </div>
                          <textarea
                            className="fr-input"
                            rows={4}
                            placeholder="Rédiger une réponse… ou générer un brouillon avec l’IA, puis l’ajuster."
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
                      )
                    )}
                  </article>
                );
              })}
            </div>

            {/* Barre d'action réponse groupée */}
            {selection && selectionnes.size > 0 && (
              <div style={{ borderTop: "1px solid #e5e5e5", padding: "0.75rem 1.25rem", background: "#fafafa" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 500, fontSize: 14 }}>
                  Répondre à {selectionnes.size} doléance{selectionnes.size > 1 ? "s" : ""} en une fois
                </p>
                <textarea
                  className="fr-input"
                  rows={3}
                  placeholder="Réponse commune à toutes les doléances sélectionnées…"
                  value={reponseGroupee}
                  onChange={(e) => setReponseGroupee(e.target.value)}
                />
                <button
                  type="button"
                  className="fr-btn fr-mt-1w"
                  disabled={envoiGroupe || !reponseGroupee.trim()}
                  onClick={envoyerGroupe}
                >
                  {envoiGroupe ? "Envoi…" : `Envoyer à ${selectionnes.size} citoyens`}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
