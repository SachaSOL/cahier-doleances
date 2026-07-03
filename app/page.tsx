import { Button } from "@codegouvfr/react-dsfr/Button";
import { StartDsfrOnHydration } from "../dsfr-bootstrap";

export default function Home() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div className="fr-card fr-card--no-border">
              <div className="fr-card__body">
                <h1 className="fr-card__title">FranceConnect</h1>
                <p className="fr-card__desc">
                  Démo simplifiée du parcours d’authentification. Aucune donnée
                  réelle n’est collectée sur cette page.
                </p>
                <div className="fr-mt-4w">
                  <Button linkProps={{ href: "/choix" }}>
                    S&apos;identifier avec FranceConnect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
