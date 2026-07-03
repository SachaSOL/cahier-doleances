import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function DashboardPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Tableau de bord élu</h1>
        <p>
          Vue élu à construire (tâche 20) : KPI, camembert interactif par thème
          (Recharts, survol = %, clic = verbatim), sélecteur d&apos;élu
          (Île-de-France ↔ commune).
        </p>
      </main>
    </>
  );
}
