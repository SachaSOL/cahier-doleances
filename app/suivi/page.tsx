import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

type Doleance = {
  id: number;
  excerpt: string;
  commune: string;
  date: string;
  status: "Déposée" | "Transmise" | "En traitement" | "Répondue";
  response?: string;
};

const doleances: Doleance[] = [
  {
    id: 1,
    excerpt: "Les lampadaires du quartier sont souvent en panne depuis plusieurs semaines.",
    commune: "Lyon",
    date: "12 juin 2026",
    status: "Déposée",
  },
  {
    id: 2,
    excerpt: "Le trottoir devant l’école est dangereux après les intempéries.",
    commune: "Villeurbanne",
    date: "3 juin 2026",
    status: "Transmise",
  },
  {
    id: 3,
    excerpt: "Le service de collecte des déchets se fait avec un retard important le matin.",
    commune: "Lyon",
    date: "28 mai 2026",
    status: "En traitement",
  },
  {
    id: 4,
    excerpt: "Le portail du parc municipal reste souvent ouvert la nuit.",
    commune: "Bron",
    date: "19 mai 2026",
    status: "Répondue",
    response:
      "Une visite de sécurité a été réalisée et un nouveau dispositif d’ouverture a été mis en place.",
  },
];

const statusSeverity: Record<Doleance["status"], "info" | "success" | "warning" | "new"> = {
  Déposée: "info",
  Transmise: "new",
  "En traitement": "warning",
  Répondue: "success",
};

export default function SuiviPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Suivi de mes doléances</h1>
        <p className="fr-text--lead">
          Retrouvez ici l’historique des demandes déjà déposées et leur état d’avancement.
        </p>

        <div className="fr-grid-row fr-grid-row--gutters">
          {doleances.map(doleance => (
            <div key={doleance.id} className="fr-col-12">
              <div className="fr-card fr-card--no-border">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
                      <p className="fr-card__desc fr-mb-1w">{doleance.excerpt}</p>
                      <Badge severity={statusSeverity[doleance.status]}>
                        {doleance.status}
                      </Badge>
                    </div>
                    <p className="fr-text--sm fr-mb-0">
                      <strong>Commune :</strong> {doleance.commune}
                    </p>
                    <p className="fr-text--sm fr-mb-0">
                      <strong>Date :</strong> {doleance.date}
                    </p>
                    {doleance.response ? (
                      <div className="fr-alert fr-alert--info fr-mt-2w" role="status">
                        <h2 className="fr-alert__title">Réponse de la collectivité</h2>
                        <p>{doleance.response}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
