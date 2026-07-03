import Link from "next/link";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function ChoixPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Choisissez votre parcours</h1>
        <p className="fr-text--lead">
          Cette démonstration vous donne accès à trois espaces distincts.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-card fr-card--no-border" style={{ height: "100%" }}>
              <div className="fr-card__body">
                <h2 className="fr-card__title">Je suis un citoyen</h2>
                <p className="fr-card__desc">
                  Déposez une doléance à destination de la collectivité
                  compétente et suivez son avancement.
                </p>
                <div className="fr-card__footer">
                  <Link className="fr-btn" href="/deposer">
                    Déposer une doléance
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-card fr-card--no-border" style={{ height: "100%" }}>
              <div className="fr-card__body">
                <h2 className="fr-card__title">Consulter les doléances</h2>
                <p className="fr-card__desc">
                  Parcourez, par territoire, les doléances déposées et les
                  réponses apportées. Données anonymisées.
                </p>
                <div className="fr-card__footer">
                  <Link className="fr-btn fr-btn--secondary" href="/consulter">
                    Explorer un territoire
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-card fr-card--no-border" style={{ height: "100%" }}>
              <div className="fr-card__body">
                <h2 className="fr-card__title">Je suis un élu ou agent</h2>
                <p className="fr-card__desc">
                  Accédez à la boîte de réception de votre territoire et
                  répondez aux doléances reçues.
                </p>
                <div className="fr-card__footer">
                  <Link className="fr-btn fr-btn--secondary" href="/espace-elu">
                    Espace élu
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
