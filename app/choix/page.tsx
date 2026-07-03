import Link from "next/link";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function ChoixPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Choisissez votre parcours</h1>
        <p className="fr-text--lead">
          Cette démo vous permet d’accéder à deux parcours distincts.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Je suis un citoyen</h2>
                <p className="fr-card__desc">
                  Déposez une doléance ou un signalement à destination de votre
                  collectivité.
                </p>
                <div className="fr-card__footer">
                  <Link className="fr-btn" href="/deposer">
                    Continuer
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Je suis un élu ou agent</h2>
                <p className="fr-card__desc">
                  Accédez à l’espace de suivi et de gestion des doléances.
                </p>
                <div className="fr-card__footer">
                  <Link className="fr-btn fr-btn--secondary" href="/dashboard">
                    Continuer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
