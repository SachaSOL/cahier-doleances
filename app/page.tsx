"use client";

import { FranceConnectButton } from "@codegouvfr/react-dsfr/FranceConnectButton";
import { StartDsfrOnHydration } from "../dsfr-bootstrap";

const providers = [
  "L’Assurance Maladie",
  "La Poste",
  "impots.gouv.fr",
  "MSA",
];

export default function Home() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body fr-text--center">
                <h1 className="fr-card__title">Je choisis un compte pour me connecter</h1>
                <p className="fr-card__desc fr-mb-4w">
                  Démonstration simplifiée du parcours FranceConnect.
                </p>

                <div className="fr-mt-2w">
                  <FranceConnectButton onClick={() => window.location.assign("/choix")} />
                </div>

                <div className="fr-mt-4w">
                  <ul className="fr-btns-group fr-btns-group--inline-md fr-btns-group--center">
                    {providers.map(provider => (
                      <li key={provider}>
                        <button
                          className="fr-btn fr-btn--secondary"
                          type="button"
                          disabled
                          aria-disabled="true"
                        >
                          {provider}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="fr-text--sm fr-mt-4w fr-text--center">
          Démonstration : aucun identifiant réel n’est demandé ni collecté.
        </p>
      </main>
    </>
  );
}
