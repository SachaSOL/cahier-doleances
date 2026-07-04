"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";

// Carte de France interactive facon Parcoursup : on descend région → département
// → commune. Chaque territoire est coloré selon son nombre de doléances.
type Niveau = "region" | "departement" | "commune";
type Props = { code: string; nom: string };
type Feat = Feature<Geometry, Props>;
type CountRow = { code: string; count: number };
type Lieu = { code: string; nom: string };

const W = 640;
const H = 640;
const REGIONS_URL =
  "https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@master/regions-version-simplifiee.geojson";
const DEPTS_URL =
  "https://cdn.jsdelivr.net/gh/gregoiredavid/france-geojson@master/departements-version-simplifiee.geojson";

const toMap = (rows: CountRow[]) =>
  Object.fromEntries(rows.map((r) => [r.code, r.count])) as Record<string, number>;

function lerp(c: number, max: number): string {
  if (!c) return "#eef1f6";
  const t = Math.min(1, Math.sqrt(c / max)); // racine → contraste sur les faibles
  const a = [210, 224, 247];
  const b = [0, 0, 145];
  const ch = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

export function CarteFrance({
  onCommune,
}: {
  onCommune: (insee: string, nom: string) => void;
}) {
  const [niveau, setNiveau] = useState<Niveau>("region");
  const [region, setRegion] = useState<Lieu | null>(null);
  const [dept, setDept] = useState<Lieu | null>(null);
  const [features, setFeatures] = useState<Feat[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<Feat | null>(null);
  const deptsAll = useRef<Feat[] | null>(null);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setHover(null);
    (async () => {
      try {
        let feats: Feat[] = [];
        let cnt: Record<string, number> = {};
        if (niveau === "region") {
          const [geo, stats] = await Promise.all([
            fetch(REGIONS_URL).then((r) => r.json() as Promise<FeatureCollection>),
            fetch("/api/stats?niveau=region").then((r) => r.json()),
          ]);
          feats = geo.features as Feat[];
          cnt = toMap(stats.counts as CountRow[]);
        } else if (niveau === "departement" && region) {
          if (!deptsAll.current) {
            const g = (await fetch(DEPTS_URL).then((r) => r.json())) as FeatureCollection;
            deptsAll.current = g.features as Feat[];
          }
          const stats = await fetch(
            `/api/stats?niveau=departement&region=${region.code}`
          ).then((r) => r.json());
          cnt = toMap(stats.counts as CountRow[]);
          const codes = new Set(Object.keys(cnt));
          feats = deptsAll.current.filter((f) => codes.has(f.properties.code));
        } else if (niveau === "commune" && dept) {
          const [geo, stats] = await Promise.all([
            fetch(
              `https://geo.api.gouv.fr/communes?codeDepartement=${dept.code}&fields=nom,code&format=geojson&geometry=contour`
            ).then((r) => r.json() as Promise<FeatureCollection>),
            fetch(`/api/stats?niveau=commune&dept=${dept.code}`).then((r) => r.json()),
          ]);
          feats = geo.features as Feat[];
          cnt = toMap(stats.counts as CountRow[]);
        }
        if (annule) return;
        setFeatures(feats);
        setCounts(cnt);
        setLoading(false);
      } catch {
        if (!annule) {
          setFeatures([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      annule = true;
    };
  }, [niveau, region, dept]);

  const { path, maxCount } = useMemo(() => {
    if (features.length === 0) return { path: null, maxCount: 1 };
    const projection = geoMercator().fitSize([W, H], {
      type: "FeatureCollection",
      features,
    } as FeatureCollection);
    return {
      path: geoPath(projection),
      maxCount: Math.max(1, ...features.map((f) => counts[f.properties.code] ?? 0)),
    };
  }, [features, counts]);

  const clic = (f: Feat) => {
    const { code, nom } = f.properties;
    if (niveau === "region") {
      setRegion({ code, nom });
      setNiveau("departement");
    } else if (niveau === "departement") {
      setDept({ code, nom });
      setNiveau("commune");
    } else {
      onCommune(code, nom);
    }
  };

  return (
    <div>
      {/* Fil d'Ariane */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button
          type="button"
          className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
          onClick={() => {
            setNiveau("region");
            setRegion(null);
            setDept(null);
          }}
        >
          France
        </button>
        {region && (
          <>
            <span aria-hidden="true">›</span>
            <button
              type="button"
              className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline"
              onClick={() => {
                setNiveau("departement");
                setDept(null);
              }}
            >
              {region.nom}
            </button>
          </>
        )}
        {dept && (
          <>
            <span aria-hidden="true">›</span>
            <span style={{ fontWeight: 500 }}>{dept.nom}</span>
          </>
        )}
      </div>

      <p className="fr-text--sm" style={{ color: "#666", margin: "0 0 8px" }}>
        {niveau === "region"
          ? "Cliquez sur une région pour voir ses départements."
          : niveau === "departement"
            ? "Cliquez sur un département pour voir ses communes."
            : "Cliquez sur une commune pour consulter ses doléances."}
        {hover && (
          <strong style={{ color: "#000091" }}>
            {"  —  "}
            {hover.properties.nom} : {counts[hover.properties.code] ?? 0} doléance
            {(counts[hover.properties.code] ?? 0) > 1 ? "s" : ""}
          </strong>
        )}
      </p>

      <div style={{ position: "relative", width: "100%", maxWidth: W, margin: "0 auto" }}>
        {loading && (
          <p style={{ textAlign: "center", padding: "2rem" }}>Chargement de la carte…</p>
        )}
        {!loading && path && (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Carte des doléances">
            {features.map((f) => {
              const c = counts[f.properties.code] ?? 0;
              const survol = hover?.properties.code === f.properties.code;
              return (
                <path
                  key={f.properties.code}
                  d={path(f) ?? ""}
                  fill={lerp(c, maxCount)}
                  stroke={survol ? "#000091" : "#ffffff"}
                  strokeWidth={survol ? 1.5 : 0.5}
                  onMouseEnter={() => setHover(f)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => clic(f)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* Légende */}
      {!loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 8, fontSize: 12, color: "#666" }}>
          <span>Moins de doléances</span>
          <span style={{ display: "inline-block", width: 120, height: 10, borderRadius: 5, background: "linear-gradient(90deg,#eef1f6,#d2e0f7,#000091)" }} />
          <span>Plus de doléances</span>
        </div>
      )}
    </div>
  );
}
