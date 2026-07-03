"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

const providers = ["L’Assurance Maladie", "La Poste", "impots.gouv.fr", "MSA"];

export default function ConnexionPage() {
  const router = useRouter();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Démo : aucune vérification réelle, on poursuit le parcours.
    router.push("/choix");
  };

  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div
              className="fr-card fr-card--no-border"
              style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.08)" }}
            >
              <div className="fr-card__body">
                <h1 className="fr-card__title fr-text--center">
                  Connexion FranceConnect
                </h1>
                <p className="fr-card__desc fr-text--center fr-mb-3w">
                  Saisissez vos identifiants pour continuer.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="fr-input-group">
                    <label className="fr-label" htmlFor="fc-id">
                      Identifiant FranceConnect
                      <span className="fr-hint-text">
                        Adresse électronique ou numéro de sécurité sociale
                      </span>
                    </label>
                    <input
                      className="fr-input"
                      id="fc-id"
                      type="text"
                      value={identifiant}
                      onChange={(e) => setIdentifiant(e.target.value)}
                      placeholder="nom@exemple.fr"
                      required
                    />
                  </div>

                  <div className="fr-input-group fr-mt-2w">
                    <label className="fr-label" htmlFor="fc-mdp">
                      Mot de passe
                    </label>
                    <input
                      className="fr-input"
                      id="fc-mdp"
                      type="password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="fr-mt-4w fr-text--center">
                    <button
                      type="submit"
                      className="fr-btn"
                      style={{ background: "#000091" }}
                    >
                      S’identifier
                    </button>
                  </div>
                </form>

                <hr className="fr-mt-4w fr-mb-3w" />
                <p className="fr-text--sm fr-text--center fr-mb-2w">
                  Ou choisissez un compte partenaire :
                </p>
                <ul className="fr-btns-group fr-btns-group--inline-md fr-btns-group--center fr-btns-group--sm">
                  {providers.map((p) => (
                    <li key={p}>
                      <button
                        type="button"
                        className="fr-btn fr-btn--secondary fr-btn--sm"
                        onClick={() => router.push("/choix")}
                      >
                        {p}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="fr-text--sm fr-mt-3w fr-text--center">
              Démonstration : aucun identifiant réel n’est vérifié ni collecté.
              Vous pouvez saisir n’importe quelle valeur.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
