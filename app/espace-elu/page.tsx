import Link from "next/link";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function EspaceEluPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Choisissez votre espace</h1>
        <p className="fr-text--lead">
          Accédez à la boîte de réception ou au tableau de bord de votre territoire.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Mes requêtes</h2>
                <p className="fr-card__desc">
                  Consultez et traitez les doléances qui vous concernent.
                </p>
                <div className="fr-card__footer">
                  <Link className="fr-btn" href="/mes-requetes">
                    Continuer
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-6">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h2 className="fr-card__title">Vue d&apos;ensemble par territoire</h2>
                <p className="fr-card__desc">
                  Statistiques et répartition des doléances par thème.
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
