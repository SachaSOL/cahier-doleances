"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { setElu, niveauTerritorial } from "@/lib/elu";

type EluResultat = {
  id: string;
  nom: string;
  mandat: string;
  niveau: string;
  territoire_code: string;
  special?: boolean;
};

const NIVEAU_LABEL: Record<string, string> = {
  commune: "Commune",
  departement: "Département",
  region: "Région",
  etat: "Circonscription",
  senateur: "Sénat",
  epci: "Intercommunalité",
  conseil_regional: "Conseil régional",
  conseil_departemental: "Conseil départemental",
  conseil_municipal: "Conseil municipal",
  arrondissement: "Arrondissement",
};

// Profil spécial « Présidente de l'Assemblée nationale » : accessible depuis la
// même barre de recherche en tapant Braun-Pivet, présidente, assemblée ou admin.
const PRESIDENTE: EluResultat = {
  id: "presidente-an",
  nom: "Yaël Braun-Pivet",
  mandat: "Présidente de l’Assemblée nationale",
  niveau: "national",
  territoire_code: "",
  special: true,
};

function correspondPresidente(q: string) {
  const s = q.toLowerCase();
  return ["braun", "pivet", "présid", "presid", "assembl", "admin"].some((m) =>
    s.includes(m)
  );
}

export default function EspaceEluPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<EluResultat[]>([]);
  const [choisi, setChoisi] = useState<EluResultat | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2 || choisi) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/elus?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      const liste: EluResultat[] = d.elus ?? [];
      // On épingle la Présidente en tête si la recherche la vise.
      setSuggestions(correspondPresidente(q) ? [PRESIDENTE, ...liste] : liste);
    }, 200);
  }, [q, choisi]);

  const entrer = () => {
    if (!choisi) return;
    if (choisi.special) {
      setElu({
        label: PRESIDENTE.nom,
        mandat: PRESIDENTE.mandat,
        niveauTerr: "national",
        code: "",
        territoireNom: "France entière",
        photo: "/braun-pivet.jpg",
      });
    } else {
      setElu({
        label: choisi.nom,
        mandat: choisi.mandat,
        niveauTerr: niveauTerritorial(choisi.niveau),
        code: choisi.territoire_code,
        territoireNom: `${NIVEAU_LABEL[choisi.niveau] ?? choisi.niveau} ${choisi.territoire_code}`,
      });
    }
    router.push("/mes-requetes");
  };

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-7">
            <h1>Espace élu</h1>
            <p className="fr-text--lead">
              Connectez-vous pour accéder aux doléances de votre territoire.
            </p>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: "1.5rem",
                boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: 20 }}>Identifiez-vous</h2>
              <p className="fr-text--sm">
                Recherchez votre nom : votre territoire est détecté
                automatiquement.
              </p>

                <div style={{ position: "relative" }}>
                  <label className="fr-label" htmlFor="elu-nom">
                    Nom de l’élu
                    <span className="fr-hint-text">
                      Ex. : Pécresse, Doucet… (démo : « admin » pour la Présidente
                      de l’Assemblée)
                    </span>
                  </label>
                  <input
                    className="fr-input"
                    id="elu-nom"
                    type="text"
                    autoComplete="off"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setChoisi(null);
                    }}
                    placeholder="Commencez à taper votre nom…"
                  />
                  {suggestions.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        zIndex: 50,
                        left: 0,
                        right: 0,
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        background: "#fff",
                        border: "1px solid #ddd",
                        maxHeight: 280,
                        overflowY: "auto",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      }}
                    >
                      {suggestions.map((el) => (
                        <li key={el.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setChoisi(el);
                              setQ(el.nom);
                              setSuggestions([]);
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              background: el.special ? "#f5f5fe" : "none",
                              border: "none",
                              borderLeft: el.special ? "3px solid #000091" : "none",
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                          >
                            <strong>{el.nom}</strong>
                            <br />
                            <span style={{ color: "#666" }}>{el.mandat}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {choisi && (
                  <div
                    className="fr-mt-3w"
                    style={{
                      background: "#f5f5fe",
                      borderLeft: "3px solid #000091",
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 14 }}>
                      <strong>{choisi.nom}</strong>
                      <br />
                      {choisi.mandat}
                      <br />
                      <span style={{ color: "#666" }}>
                        {choisi.special
                          ? "Vue nationale (France entière)"
                          : `Territoire détecté : ${NIVEAU_LABEL[choisi.niveau] ?? choisi.niveau} · ${choisi.territoire_code}`}
                      </span>
                    </p>
                    <button type="button" className="fr-btn fr-mt-2w" onClick={entrer}>
                      Accéder à mes doléances
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
