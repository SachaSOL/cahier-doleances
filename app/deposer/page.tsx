"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

type ReponseDepot = {
  ok: boolean;
  doleance?: { id: string; statut: string };
  elu?: { nom: string; mandat: string };
  justification?: string;
  theme?: string;
  erreur?: string;
};

export default function DeposerPage() {
  const [message, setMessage] = useState("");
  const [commune, setCommune] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<ReponseDepot | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEnvoi(true);
    try {
      const reponse = await fetch("/api/doleance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: message, commune }),
      });
      setResultat((await reponse.json()) as ReponseDepot);
    } catch {
      setResultat({ ok: false, erreur: "Impossible de joindre le serveur." });
    }
    setSubmitted(true);
    setEnvoi(false);
  };

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
              Racontez votre situation en quelques mots. Votre demande sera
              transmise à l’équipe compétente après validation.
            </p>

            <form onSubmit={handleSubmit}>
              <Input
                label="Votre doléance"
                hintText="Décrivez précisément votre demande ou votre problème."
                textArea
                nativeTextAreaProps={{
                  value: message,
                  onChange: event => setMessage(event.target.value),
                  rows: 10,
                  placeholder: "Exemple : l’éclairage public est défaillant…",
                  required: true,
                }}
              />

              <div className="fr-mt-3w">
                <Input
                  label="Commune"
                  hintText="Indiquez la commune concernée."
                  nativeInputProps={{
                    value: commune,
                    onChange: event => setCommune(event.target.value),
                    placeholder: "Exemple : Lyon",
                    required: true,
                  }}
                />
              </div>

              <div className="fr-mt-4w">
                <Button nativeButtonProps={{ type: "submit", disabled: envoi }}>
                  {envoi ? "Analyse de votre demande…" : "Envoyer"}
                </Button>
              </div>
            </form>

            {submitted && resultat?.ok ? (
              <div className="fr-alert fr-alert--success fr-mt-4w" role="status">
                <h2 className="fr-alert__title">Doléance transmise</h2>
                <p>
                  {resultat.justification} Elle a été transmise à :{" "}
                  <strong>
                    {resultat.elu?.nom} — {resultat.elu?.mandat}
                  </strong>
                  .
                </p>
                <p className="fr-text--sm">
                  Numéro de suivi : {resultat.doleance?.id.slice(0, 8)}
                </p>
                <div className="fr-mt-3w">
                  <Button linkProps={{ href: "/suivi" }}>Suivre mes demandes</Button>
                </div>
              </div>
            ) : null}
            {submitted && resultat && !resultat.ok ? (
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
