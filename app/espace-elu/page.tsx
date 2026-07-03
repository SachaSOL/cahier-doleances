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
};

const NIVEAU_LABEL: Record<string, string> = {
  commune: "Commune",
  departement: "Département",
  region: "Région",
  etat: "National (circonscription)",
  senateur: "Sénat",
  epci: "Intercommunalité",
  conseil_regional: "Conseil régional",
  conseil_departemental: "Conseil départemental",
  conseil_municipal: "Conseil municipal",
  arrondissement: "Arrondissement",
};

export default function EspaceEluPage() {
  const router = useRouter();

  // --- Connexion administrateur (admin / admin) → Présidente de l'AN ---
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreurAdmin, setErreurAdmin] = useState("");

  const connexionAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === "admin" && mdp.trim() === "admin") {
      setElu({
        label: "Yaël Braun-Pivet",
        mandat: "Présidente de l’Assemblée nationale",
        niveauTerr: "national",
        code: "",
        territoireNom: "France entière",
        photo: "/braun-pivet.jpg",
      });
      router.push("/mes-requetes");
    } else {
      setErreurAdmin("Identifiants incorrects. (Astuce démo : admin / admin)");
    }
  };

  // --- Recherche par nom d'élu → territoire automatique ---
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
      setSuggestions(d.elus ?? []);
    }, 220);
  }, [q, choisi]);

  const entrerCommeElu = () => {
    if (!choisi) return;
    setElu({
      label: choisi.nom,
      mandat: choisi.mandat,
      niveauTerr: niveauTerritorial(choisi.niveau),
      code: choisi.territoire_code,
      territoireNom: `${NIVEAU_LABEL[choisi.niveau] ?? choisi.niveau} ${choisi.territoire_code}`,
    });
    router.push("/mes-requetes");
  };

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Espace élu</h1>
        <p className="fr-text--lead">
          Connectez-vous pour accéder aux doléances de votre territoire.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          {/* Connexion administrateur */}
          <div className="fr-col-12 fr-col-md-6">
            <div
              className="fr-card fr-card--no-border"
              style={{ height: "100%", boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
            >
              <div className="fr-card__body">
                <h2 className="fr-card__title">Connexion sécurisée</h2>
                <p className="fr-card__desc fr-text--sm">
                  Accès réservé aux élus et à leurs services.
                </p>
                <form onSubmit={connexionAdmin}>
                  <div className="fr-input-group">
                    <label className="fr-label" htmlFor="elu-email">
                      Identifiant
                    </label>
                    <input
                      className="fr-input"
                      id="elu-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin"
                    />
                  </div>
                  <div className="fr-input-group fr-mt-2w">
                    <label className="fr-label" htmlFor="elu-mdp">
                      Mot de passe
                    </label>
                    <input
                      className="fr-input"
                      id="elu-mdp"
                      type="password"
                      value={mdp}
                      onChange={(e) => setMdp(e.target.value)}
                      placeholder="admin"
                    />
                  </div>
                  {erreurAdmin && (
                    <p className="fr-error-text">{erreurAdmin}</p>
                  )}
                  <div className="fr-mt-3w">
                    <button type="submit" className="fr-btn">
                      Se connecter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Recherche par nom */}
          <div className="fr-col-12 fr-col-md-6">
            <div
              className="fr-card fr-card--no-border"
              style={{ height: "100%", boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
            >
              <div className="fr-card__body">
                <h2 className="fr-card__title">Je suis un élu</h2>
                <p className="fr-card__desc fr-text--sm">
                  Recherchez votre nom : votre territoire est détecté
                  automatiquement.
                </p>
                <div style={{ position: "relative" }}>
                  <label className="fr-label" htmlFor="elu-nom">
                    Votre nom
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
                    placeholder="Ex. : Pécresse, Doucet…"
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
                        maxHeight: 240,
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
                              padding: "8px 12px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                          >
                            {el.nom}{" "}
                            <span style={{ color: "#666" }}>— {el.mandat}</span>
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
                        Territoire détecté :{" "}
                        {NIVEAU_LABEL[choisi.niveau] ?? choisi.niveau} ·{" "}
                        {choisi.territoire_code}
                      </span>
                    </p>
                    <button
                      type="button"
                      className="fr-btn fr-mt-2w"
                      onClick={entrerCommeElu}
                    >
                      Accéder à mes doléances
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
