import { StartDsfrOnHydration } from "../../dsfr-bootstrap";

export default function SecretariatPage() {
  return (
    <>
      <StartDsfrOnHydration />
      <main className="fr-container fr-py-6w">
        <h1>Espace secrétariat</h1>
        <p>
          Vue secrétaire à construire (tâche 19) : inbox par territoire,
          doléances groupées par thème, réponse pré-rédigée par l&apos;IA
          (kit/prompts/4), changement de statut en un clic.
        </p>
      </main>
    </>
  );
}
