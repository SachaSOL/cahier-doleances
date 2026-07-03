"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function DeposerPage() {
  const [message, setMessage] = useState("");
  const [commune, setCommune] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-lg-8">
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
                <Button nativeButtonProps={{ type: "submit" }}>Envoyer</Button>
              </div>
            </form>

            {submitted ? (
              <div className="fr-alert fr-alert--success fr-mt-4w" role="status">
                <h2 className="fr-alert__title">Doléance envoyée</h2>
                <p>Merci pour votre message. Votre dépôt a bien été pris en compte.</p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
