"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";
import { getFcSub } from "@/lib/citoyen";
import { labelTheme } from "@/lib/statuts";

type ReponseDepot = {
  ok: boolean;
  doleance?: { id: string; statut: string };
  elu?: { nom: string; mandat: string };
  justification?: string;
  theme?: string;
  urgence?: string;
  similaires?: number;
  erreur?: string;
};

const TRANCHES = ["18-24", "25-34", "35-49", "50-64", "65+"];

export default function DeposerPage() {
  const [message, setMessage] = useState("");
  const [commune, setCommune] = useState("");
  const [trancheAge, setTrancheAge] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<ReponseDepot | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnvoi(true);
    setResultat(null);
    try {
      const reponse = await fetch("/api/doleance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texte: message,
          commune,
          tranche_age: trancheAge,
          fc_sub_mock: getFcSub(),
        }),
      });
      setResultat((await reponse.json()) as ReponseDepot);
    } catch {
      setResultat({ ok: false, erreur: "Impossible de joindre le serveur." });
    }
    setEnvoi(false);
  };

  if (resultat?.ok) {
    return (
      <>
        <StartDsfrOnHydration />
        <main className="fr-container fr-py-6w">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-lg-8">
              <div
                className="fr-alert fr-alert--success"
                role="status"
                style={{ marginBottom: "2rem" }}
              >
                <h2 className="fr-alert__title">Votre doléance a été transmise</h2>
                <p>{resultat.justification}</p>
              </div>

              {resultat.similaires !== undefined && resultat.similaires > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#f5f5fe",
                    border: "1px solid #e3e3fd",
                    borderLeft: "4px solid #000091",
                    borderRadius: 8,
                    padding: "1rem 1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <span style={{ fontSize: 28, fontWeight: 700, color: "#000091" }}>
                    +{resultat.similaires}
                  </span>
                  <p style={{ margin: 0, fontSize: 15 }}>
                    Votre voix n’est pas isolée : votre signalement rejoint{" "}
                    <strong>
                      {resultat.similaires} autre
                      {resultat.similaires > 1 ? "s" : ""} doléance
                      {resultat.similaires > 1 ? "s" : ""}
                    </strong>{" "}
                    de type <strong>{labelTheme(resultat.theme ?? null)}</strong> dans
                    le secteur de {commune} ce mois-ci. Ensemble, elles pèsent.
                  </p>
                </div>
              )}

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                  padding: "1.25rem 1.5rem",
                  boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
                }}
              >
                <p className="fr-mb-1w">
                  <strong>Destinataire :</strong> {resultat.elu?.nom} —{" "}
                  {resultat.elu?.mandat}
                </p>
                <p className="fr-mb-1w">
                  <strong>Thème identifié :</strong> {labelTheme(resultat.theme ?? null)}
                  {resultat.urgence ? ` · urgence ${resultat.urgence}` : ""}
                </p>
                <p className="fr-mb-0">
                  <strong>Numéro de suivi :</strong>{" "}
                  {resultat.doleance?.id.slice(0, 8)}
                </p>
              </div>

              <div className="fr-btns-group fr-btns-group--inline-md fr-mt-4w">
                <Button linkProps={{ href: "/suivi" }}>Suivre mes doléances</Button>
                <Button
                  priority="secondary"
                  onClick={() => {
                    setMessage("");
                    setCommune("");
                    setResultat(null);
                  }}
                >
                  Déposer une autre doléance
                </Button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-lg-8">
            <div className="fr-mb-2w">
              <Link className="fr-link" href="/suivi">
                Voir le suivi de mes demandes
              </Link>
            </div>
            <h1>Déposer une doléance</h1>
            <p className="fr-text--lead">
              Racontez votre situation en quelques mots. Notre assistant
              l’anonymise, identifie le thème et la transmet à l’élu compétent.
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Votre doléance"
                hintText="Décrivez précisément votre demande ou votre problème."
                textArea
                nativeTextAreaProps={{
                  value: message,
                  onChange: (event) => setMessage(event.target.value),
                  rows: 8,
                  placeholder: "Exemple : le passage piéton devant l’école est effacé…",
                  required: true,
                }}
              />

              <div className="fr-mt-3w">
                <Input
                  label="Commune concernée"
                  hintText="Saisissez le nom de la commune (n’importe où en France)."
                  nativeInputProps={{
                    value: commune,
                    onChange: (event) => setCommune(event.target.value),
                    placeholder: "Exemple : Marseille",
                    required: true,
                  }}
                />
              </div>

              <div className="fr-mt-3w">
                <label className="fr-label" htmlFor="tranche-age">
                  Votre tranche d’âge
                  <span className="fr-hint-text">
                    Sert uniquement aux statistiques anonymes. Aucune date de
                    naissance n’est collectée.
                  </span>
                </label>
                <select
                  className="fr-select"
                  id="tranche-age"
                  value={trancheAge}
                  onChange={(event) => setTrancheAge(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Sélectionnez…
                  </option>
                  {TRANCHES.map((t) => (
                    <option key={t} value={t}>
                      {t} ans
                    </option>
                  ))}
                </select>
              </div>

              <div className="fr-mt-4w">
                <Button nativeButtonProps={{ type: "submit", disabled: envoi }}>
                  {envoi ? "Analyse de votre demande…" : "Envoyer"}
                </Button>
              </div>
            </form>

            {resultat && !resultat.ok ? (
              <div className="fr-alert fr-alert--error fr-mt-4w" role="alert">
                <h2 className="fr-alert__title">Envoi impossible</h2>
                <p>{resultat.erreur}</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
